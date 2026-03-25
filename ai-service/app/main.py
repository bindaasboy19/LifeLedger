import os
from datetime import datetime, timedelta
from typing import List

import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.linear_model import LinearRegression


class TrainingRecord(BaseModel):
    date: datetime
    region: str
    blood_group: str = Field(pattern=r'^(O-|O\+|A-|A\+|B-|B\+|AB-|AB\+)$')
    sos_count: float = Field(ge=0)
    usage_units: float = Field(ge=0)
    camp_donation_volume: float = Field(ge=0)


class PredictRequest(BaseModel):
    records: List[TrainingRecord] = []


app = FastAPI(title='LifeLedger AI Service', version='1.1.0')

allowed_origins = os.getenv(
    'ALLOWED_ORIGINS',
    'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5000,http://127.0.0.1:5000'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins.split(',') if origin.strip()],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)


def risk_level(score: float) -> str:
    if score >= 2.2:
        return 'high'
    if score >= 1.4:
        return 'medium'
    return 'low'


def demo_response():
    today = datetime.utcnow().date()
    aggregate = []
    for idx in range(7):
        day = today + timedelta(days=idx + 1)
        aggregate.append({'day': day.isoformat(), 'predicted_demand': round(80 + idx * 3.5, 2)})

    return {
        'generated_at': datetime.utcnow().isoformat(),
        'source': 'demo_fallback',
        'predictions': [
            {
                'region': 'Delhi',
                'blood_group': 'O-',
                'next_7_day_demand': [14, 15, 16, 16, 17, 18, 19],
                'predicted_total_demand': 115.0,
                'shortage_risk_score': 2.35,
                'risk_level': 'high'
            },
            {
                'region': 'Mumbai',
                'blood_group': 'A+',
                'next_7_day_demand': [12, 12, 13, 14, 14, 15, 16],
                'predicted_total_demand': 96.0,
                'shortage_risk_score': 1.72,
                'risk_level': 'medium'
            }
        ],
        'aggregate_daily_forecast': aggregate,
        'warning': 'No training records supplied. Returning demo forecast.'
    }


@app.get('/')
def root():
    return {'service': 'LifeLedger AI Service', 'status': 'ok'}


@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'ai'}


@app.post('/predict')
def predict(payload: PredictRequest):
    if not payload.records:
        return demo_response()

    frame = pd.DataFrame([row.model_dump() for row in payload.records])
    frame['date'] = pd.to_datetime(frame['date'])
    frame.sort_values(['region', 'blood_group', 'date'], inplace=True)

    predictions = []
    aggregate = {}

    for (region, blood_group), group in frame.groupby(['region', 'blood_group']):
        group = group.sort_values('date').copy()
        group['demand_proxy'] = group['sos_count'] + group['usage_units'] - (0.6 * group['camp_donation_volume'])
        group['day_index'] = np.arange(len(group))

        features = group[['day_index', 'sos_count', 'usage_units', 'camp_donation_volume']].values
        target = group['demand_proxy'].values

        if len(group) < 2:
            baseline = float(target[-1]) if len(target) else 0.0
            forecast = [max(0.0, baseline) for _ in range(7)]
        else:
            model = LinearRegression()
            try:
                model.fit(features, target)
            except Exception:
                baseline = float(np.mean(target)) if len(target) else 0.0
                forecast = [max(0.0, baseline * (1 + day * 0.01)) for day in range(1, 8)]
            else:
                last = group.iloc[-1]
                forecast = []
                for day in range(1, 8):
                    idx = float(last['day_index'] + day)
                    sos = float(max(0.0, last['sos_count'] * (1 + day * 0.01)))
                    usage = float(max(0.0, last['usage_units'] * (1 + day * 0.015)))
                    camp = float(max(0.0, last['camp_donation_volume'] * (1 - day * 0.03)))
                    value = float(model.predict(np.array([[idx, sos, usage, camp]]))[0])
                    forecast.append(max(0.0, value))

        total_forecast = float(np.sum(forecast))
        supply_anchor = float(group['camp_donation_volume'].tail(7).mean() + 1)
        shortage_score = float(total_forecast / (7 * supply_anchor))

        for i, value in enumerate(forecast, start=1):
            day = (datetime.utcnow().date() + timedelta(days=i)).isoformat()
            aggregate[day] = aggregate.get(day, 0.0) + float(value)

        predictions.append(
            {
                'region': region,
                'blood_group': blood_group,
                'next_7_day_demand': [round(v, 2) for v in forecast],
                'predicted_total_demand': round(total_forecast, 2),
                'shortage_risk_score': round(shortage_score, 2),
                'risk_level': risk_level(shortage_score)
            }
        )

    aggregate_daily_forecast = [
        {
            'day': day,
            'predicted_demand': round(value, 2)
        }
        for day, value in sorted(aggregate.items(), key=lambda item: item[0])
    ]

    return {
        'generated_at': datetime.utcnow().isoformat(),
        'source': 'ai_service',
        'predictions': sorted(
            predictions,
            key=lambda item: item['shortage_risk_score'],
            reverse=True
        ),
        'aggregate_daily_forecast': aggregate_daily_forecast
    }
