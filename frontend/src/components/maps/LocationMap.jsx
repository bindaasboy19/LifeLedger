import React, { memo, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { TILE_LAYERS, calculateHaversineDistanceKm, createLeafletIcon } from '../../lib/leafletMapUtils.js';

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const isValidPoint = (point) =>
  point &&
  Number.isFinite(Number(point.lat)) &&
  Number.isFinite(Number(point.lng));

const markerKey = (marker) => marker.id || `${marker.lat}-${marker.lng}-${marker.title || 'marker'}`;

function MapViewController({ center, zoom, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    } else if (isValidPoint(center)) {
      map.setView([center.lat, center.lng], zoom);
    }
  }, [map, center, zoom, bounds]);

  return null;
}

const FallbackPanel = ({ markers, origin, destination }) => (
  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">
    <p className="font-medium text-slate-700 dark:text-slate-200">Map view (Coordinates Summary)</p>
    {origin && destination ? (
      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
        <p className="font-medium text-slate-800 dark:text-slate-100">Route summary</p>
        <p className="text-xs text-slate-500 dark:text-slate-300">
          Origin: {Number(origin.lat).toFixed(4)}, {Number(origin.lng).toFixed(4)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-300">
          Destination: {Number(destination.lat).toFixed(4)}, {Number(destination.lng).toFixed(4)}
        </p>
      </div>
    ) : null}
    {markers.length > 0 ? (
      <div className="mt-3 space-y-2">
        {markers.slice(0, 6).map((marker) => (
          <div key={markerKey(marker)} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{marker.title}</p>
            <a
              href={`https://www.openstreetmap.org/?mlat=${marker.lat}&mlon=${marker.lng}#map=15/${marker.lat}/${marker.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs font-semibold text-red-600 hover:text-red-500"
            >
              Open in OpenStreetMap
            </a>
          </div>
        ))}
      </div>
    ) : null}
  </div>
);

const LocationMap = memo(function LocationMap({
  markers = [],
  center,
  zoom = 5,
  height = '320px',
  origin = null,
  destination = null,
  showDirections = false
}) {
  const resolvedCenter = useMemo(() => {
    if (isValidPoint(center)) return { lat: Number(center.lat), lng: Number(center.lng) };
    if (markers[0] && isValidPoint(markers[0])) return { lat: Number(markers[0].lat), lng: Number(markers[0].lng) };
    if (isValidPoint(destination)) return { lat: Number(destination.lat), lng: Number(destination.lng) };
    return defaultCenter;
  }, [center, destination, markers]);

  const validMarkers = useMemo(
    () => markers.filter((m) => isValidPoint(m)),
    [markers]
  );

  const routePolyline = useMemo(() => {
    if (showDirections && isValidPoint(origin) && isValidPoint(destination)) {
      return [
        [Number(origin.lat), Number(origin.lng)],
        [Number(destination.lat), Number(destination.lng)]
      ];
    }
    return null;
  }, [showDirections, origin, destination]);

  const routeDistanceKm = useMemo(() => {
    if (routePolyline) {
      return calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
    }
    return 0;
  }, [routePolyline, origin, destination]);

  const bounds = useMemo(() => {
    const points = [];
    validMarkers.forEach((m) => points.push([Number(m.lat), Number(m.lng)]));
    if (isValidPoint(origin)) points.push([Number(origin.lat), Number(origin.lng)]);
    if (isValidPoint(destination)) points.push([Number(destination.lat), Number(destination.lng)]);
    return points.length > 1 ? points : null;
  }, [validMarkers, origin, destination]);

  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const tileConfig = isDarkMode ? TILE_LAYERS.dark : TILE_LAYERS.standard;

  if ((center === null || !isValidPoint(resolvedCenter)) && validMarkers.length === 0 && !origin && !destination) {
    return <FallbackPanel markers={markers} origin={origin} destination={destination} />;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-300 dark:border-slate-800 shadow-inner" style={{ height }}>
      <MapContainer
        center={[resolvedCenter.lat, resolvedCenter.lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer url={tileConfig.url} attribution={tileConfig.attribution} />
        <MapViewController center={resolvedCenter} zoom={zoom} bounds={bounds} />

        {validMarkers.map((marker) => (
          <Marker
            key={markerKey(marker)}
            position={[Number(marker.lat), Number(marker.lng)]}
            icon={createLeafletIcon({ type: marker.type || 'donor' })}
          >
            <Popup>
              <div className="p-1 space-y-1">
                <p className="font-bold text-slate-900 text-xs">{marker.title || 'Location Pin'}</p>
                <p className="text-[11px] text-slate-500">
                  {Number(marker.lat).toFixed(4)}, {Number(marker.lng).toFixed(4)}
                </p>
                <a
                  href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${marker.lat}%2C${marker.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-red-600 hover:underline block pt-1"
                >
                  Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {isValidPoint(origin) && (
          <Marker
            position={[Number(origin.lat), Number(origin.lng)]}
            icon={createLeafletIcon({ type: 'user_location' })}
          >
            <Popup>
              <span className="font-semibold text-xs">Origin Location</span>
            </Popup>
          </Marker>
        )}

        {isValidPoint(destination) && (
          <Marker
            position={[Number(destination.lat), Number(destination.lng)]}
            icon={createLeafletIcon({ type: 'hospital' })}
          >
            <Popup>
              <span className="font-semibold text-xs">Destination Location</span>
            </Popup>
          </Marker>
        )}

        {routePolyline && (
          <Polyline
            positions={routePolyline}
            color="#ef4444"
            weight={4}
            opacity={0.85}
            dashArray="8, 8"
          />
        )}
      </MapContainer>

      {routeDistanceKm > 0 && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs font-semibold shadow-lg">
          Direct Distance: <span className="text-red-400 font-bold">{routeDistanceKm} km</span>
        </div>
      )}
    </div>
  );
});

export default LocationMap;
