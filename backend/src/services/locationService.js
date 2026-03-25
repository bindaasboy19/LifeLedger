const EARTH_RADIUS_KM = 6371;

const deg2rad = (deg) => (deg * Math.PI) / 180;

export const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  if ([lat1, lng1, lat2, lng2].some((v) => v === undefined || v === null)) {
    return null;
  }

  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

export const inRadius = (origin, target, radiusKm) => {
  const distance = calculateDistanceKm(origin.lat, origin.lng, target.lat, target.lng);
  if (distance === null) return false;
  return distance <= radiusKm;
};
