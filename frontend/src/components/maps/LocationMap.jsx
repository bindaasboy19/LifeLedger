import { memo, useMemo } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const cleanEnv = (value) => {
  if (!value) return value;
  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const LocationMap = memo(function LocationMap({ markers = [], center, zoom = 5, height = '320px' }) {
  const apiKey = cleanEnv(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  const invalidKeyFormat = apiKey?.startsWith('G-');
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: invalidKeyFormat ? '' : apiKey || ''
  });
  const resolvedCenter = useMemo(
    () => center || (markers[0] ? { lat: markers[0].lat, lng: markers[0].lng } : defaultCenter),
    [center, markers]
  );

  if (!apiKey || invalidKeyFormat || loadError) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">
        <p className="font-medium">Map preview is unavailable right now.</p>
        {markers.length > 0 ? (
          <div className="mt-3 space-y-2">
            {markers.slice(0, 6).map((marker) => (
              <div key={marker.id || `${marker.lat}-${marker.lng}`} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
                <p>{marker.title}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${marker.lat},${marker.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-brand-600"
                >
                  Open location
                </a>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="text-sm text-slate-500">Loading map...</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height }}
        center={resolvedCenter}
        zoom={zoom}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id || `${marker.lat}-${marker.lng}`}
            position={{ lat: marker.lat, lng: marker.lng }}
            title={marker.title}
          />
        ))}
      </GoogleMap>
    </div>
  );
});

export default LocationMap;
