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

export default function LocationMap({ markers = [], center, zoom = 5, height = '320px' }) {
  const apiKey = cleanEnv(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  const invalidKeyFormat = apiKey?.startsWith('G-');
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: invalidKeyFormat ? '' : apiKey || ''
  });

  if (!apiKey || invalidKeyFormat) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">
        Set a valid Google Maps API key in `VITE_GOOGLE_MAPS_API_KEY` to enable map view.
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
        center={center || markers[0] || defaultCenter}
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
}
