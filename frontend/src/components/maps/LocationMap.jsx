import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { getGoogleMapsApiKey, loadGoogleMaps } from '../../lib/googleMapsLoader.js';

const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const isValidPoint = (point) =>
  point &&
  Number.isFinite(Number(point.lat)) &&
  Number.isFinite(Number(point.lng));

const markerKey = (marker) => marker.id || `${marker.lat}-${marker.lng}-${marker.title || 'marker'}`;

const FallbackPanel = ({ markers, origin, destination }) => (
  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm dark:border-slate-700">
    <p className="font-medium">Map preview is unavailable right now.</p>
    {origin && destination ? (
      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
        <p className="font-medium">Route summary</p>
        <p className="text-xs text-slate-500 dark:text-slate-300">
          Donor: {Number(origin.lat).toFixed(4)}, {Number(origin.lng).toFixed(4)}
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

const LocationMap = memo(function LocationMap({
  markers = [],
  center,
  zoom = 5,
  height = '320px',
  origin = null,
  destination = null,
  showDirections = false
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);
  const directionsRendererRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const resolvedCenter = useMemo(() => {
    if (isValidPoint(center)) return { lat: Number(center.lat), lng: Number(center.lng) };
    if (markers[0]) return { lat: Number(markers[0].lat), lng: Number(markers[0].lng) };
    if (isValidPoint(destination)) return { lat: Number(destination.lat), lng: Number(destination.lng) };
    return defaultCenter;
  }, [center, destination, markers]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        await loadGoogleMaps();
        if (!active || !containerRef.current) return;

        mapRef.current =
          mapRef.current ||
          new globalThis.google.maps.Map(containerRef.current, {
            center: resolvedCenter,
            zoom,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          });

        mapRef.current.setCenter(resolvedCenter);
        mapRef.current.setZoom(zoom);

        markerRefs.current.forEach((marker) => marker.setMap(null));
        markerRefs.current = markers
          .filter((marker) => isValidPoint(marker))
          .map(
            (marker) =>
              new globalThis.google.maps.Marker({
                map: mapRef.current,
                position: { lat: Number(marker.lat), lng: Number(marker.lng) },
                title: marker.title
              })
          );

        if (showDirections && isValidPoint(origin) && isValidPoint(destination)) {
          directionsRendererRef.current =
            directionsRendererRef.current ||
            new globalThis.google.maps.DirectionsRenderer({ suppressMarkers: false });

          directionsRendererRef.current.setMap(mapRef.current);

          const directionsService = new globalThis.google.maps.DirectionsService();
          directionsService.route(
            {
              origin: { lat: Number(origin.lat), lng: Number(origin.lng) },
              destination: { lat: Number(destination.lat), lng: Number(destination.lng) },
              travelMode: globalThis.google.maps.TravelMode.DRIVING
            },
            (result, status) => {
              if (!active) return;
              if (status === 'OK' && result) {
                directionsRendererRef.current.setDirections(result);
              }
            }
          );
        } else if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }

        setLoadError(false);
      } catch {
        if (active) {
          setLoadError(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [markers, resolvedCenter, zoom, showDirections, origin, destination]);

  if (!getGoogleMapsApiKey() || loadError) {
    return <FallbackPanel markers={markers} origin={origin} destination={destination} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  );
});

export default LocationMap;
