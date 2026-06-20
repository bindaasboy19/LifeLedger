let loaderPromise = null;

const cleanEnv = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

export const getGoogleMapsApiKey = () => cleanEnv(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

export const loadGoogleMaps = async () => {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error('MAPS_CONFIG_MISSING');
  }

  if (globalThis.google?.maps) {
    return globalThis.google.maps;
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('lifeledger-google-maps');
    if (existing) {
      existing.addEventListener('load', () => resolve(globalThis.google.maps), { once: true });
      existing.addEventListener('error', () => reject(new Error('MAPS_LOAD_FAILED')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'lifeledger-google-maps';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(globalThis.google.maps);
    script.onerror = () => reject(new Error('MAPS_LOAD_FAILED'));
    document.head.appendChild(script);
  });

  return loaderPromise;
};
