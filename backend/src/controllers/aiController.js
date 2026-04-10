import { asyncHandler } from '../utils/http.js';
import { AITrainingData } from '../models/AITrainingData.js';
import mongoose from 'mongoose';
import { checkPredictionServiceHealth, requestPrediction } from '../services/aiService.js';

const fallbackFromRecords = (records = []) => {
  const grouped = new Map();

  records.forEach((row) => {
    const key = `${row.region}::${row.bloodGroup}`;
    const demandProxy = Number(row.sosCount) + Number(row.usageUnits) - Number(row.campDonationVolume) * 0.6;

    if (!grouped.has(key)) {
      grouped.set(key, {
        region: row.region,
        bloodGroup: row.bloodGroup,
        signals: []
      });
    }

    grouped.get(key).signals.push({
      date: new Date(row.date),
      demandProxy,
      campDonationVolume: Number(row.campDonationVolume)
    });
  });

  const predictions = [];
  const aggregateDaily = {};

  for (const [, group] of grouped.entries()) {
    const signals = group.signals.sort((a, b) => a.date - b.date);
    const recent = signals.slice(-14);

    const avgDemand =
      recent.reduce((acc, item) => acc + item.demandProxy, 0) / (recent.length || 1);
    const avgSupply =
      recent.reduce((acc, item) => acc + item.campDonationVolume, 0) / (recent.length || 1);

    const forecast = Array.from({ length: 7 }).map((_, day) => {
      const trendBoost = 1 + day * 0.015;
      const value = Math.max(0, avgDemand * trendBoost);
      const targetDay = new Date();
      targetDay.setDate(targetDay.getDate() + day + 1);
      const dayKey = targetDay.toISOString().slice(0, 10);
      aggregateDaily[dayKey] = (aggregateDaily[dayKey] || 0) + value;
      return Number(value.toFixed(2));
    });

    const total = forecast.reduce((a, b) => a + b, 0);
    const score = total / (7 * (avgSupply + 1));

    predictions.push({
      region: group.region,
      blood_group: group.bloodGroup,
      next_7_day_demand: forecast,
      predicted_total_demand: Number(total.toFixed(2)),
      shortage_risk_score: Number(score.toFixed(2)),
      risk_level: score >= 2.2 ? 'high' : score >= 1.4 ? 'medium' : 'low'
    });
  }

  return {
    generated_at: new Date().toISOString(),
    source: 'backend_fallback',
    predictions: predictions.sort((a, b) => b.shortage_risk_score - a.shortage_risk_score),
    aggregate_daily_forecast: Object.entries(aggregateDaily)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([day, predicted]) => ({
        day,
        predicted_demand: Number(predicted.toFixed(2))
      }))
  };
};

const demoFallback = () => {
  const today = new Date();
  const aggregate_daily_forecast = Array.from({ length: 7 }).map((_, idx) => {
    const day = new Date(today);
    day.setDate(day.getDate() + idx + 1);
    return {
      day: day.toISOString().slice(0, 10),
      predicted_demand: 85 + idx * 4
    };
  });

  return {
    generated_at: new Date().toISOString(),
    source: 'demo_fallback',
    predictions: [
      {
        region: 'Delhi',
        blood_group: 'O-',
        next_7_day_demand: [14, 15, 16, 16, 17, 18, 19],
        predicted_total_demand: 115,
        shortage_risk_score: 2.35,
        risk_level: 'high'
      },
      {
        region: 'Mumbai',
        blood_group: 'A+',
        next_7_day_demand: [12, 12, 13, 14, 14, 15, 16],
        predicted_total_demand: 96,
        shortage_risk_score: 1.72,
        risk_level: 'medium'
      },
      {
        region: 'Bengaluru',
        blood_group: 'B+',
        next_7_day_demand: [9, 10, 10, 11, 11, 12, 12],
        predicted_total_demand: 75,
        shortage_risk_score: 1.28,
        risk_level: 'low'
      }
    ],
    aggregate_daily_forecast
  };
};

const readTrainingData = async (region) => {
  if (mongoose.connection.readyState !== 1) {
    return [];
  }

  try {
    const query = region ? { region } : {};
    return await AITrainingData.find(query).sort({ date: 1 }).lean();
  } catch {
    return [];
  }
};

export const getPredictionHealth = asyncHandler(async (_req, res) => {
  const aiHealth = await checkPredictionServiceHealth();

  res.json({
    success: true,
    data: {
      status: aiHealth.available ? 'up' : 'degraded',
      aiService: aiHealth.available ? 'up' : 'down',
      mongo: mongoose.connection.readyState === 1 ? 'up' : 'down',
      source: aiHealth.source
    }
  });
});

export const getPrediction = asyncHandler(async (req, res) => {
  const { region } = req.body;
  const records = await readTrainingData(region);

  if (records.length === 0) {
    res.json({
      success: true,
      data: {
        ...demoFallback(),
        warning:
          mongoose.connection.readyState === 1
            ? 'Historical AI training data is not available yet. Showing demo forecast.'
            : 'Prediction history store is temporarily unavailable. Showing demo forecast.'
      }
    });
    return;
  }

  const payload = {
    records: records.map((row) => ({
      date: row.date,
      region: row.region,
      blood_group: row.bloodGroup,
      sos_count: row.sosCount,
      usage_units: row.usageUnits,
      camp_donation_volume: row.campDonationVolume
    }))
  };

  try {
    const prediction = await requestPrediction(payload);
    res.json({
      success: true,
      data: {
        ...prediction,
        source: prediction.source || 'ai_service'
      }
    });
  } catch (error) {
    const fallback = fallbackFromRecords(records);
    res.json({
      success: true,
      data: {
        ...fallback,
        warning: 'Prediction service is temporarily unavailable. Showing resilient forecast mode.'
      }
    });
  }
});
