export const roles = [
  { value: '', label: 'Please select role', disabled: true },
  { value: 'user', label: 'Community Member' },
  { value: 'ngo', label: 'NGO / Organizer' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'blood_bank', label: 'Blood Bank' }
];

export const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

export const locationHierarchy = {
  India: {
    Delhi: {
      Delhi: { lat: 28.6139, lng: 77.209 }
    },
    Maharashtra: {
      Mumbai: { lat: 19.076, lng: 72.8777 },
      Pune: { lat: 18.5204, lng: 73.8567 }
    },
    Karnataka: {
      Bengaluru: { lat: 12.9716, lng: 77.5946 },
      Mysuru: { lat: 12.2958, lng: 76.6394 }
    }
  }
};

export const countries = Object.keys(locationHierarchy);

export const getStatesForCountry = (country) =>
  country && locationHierarchy[country] ? Object.keys(locationHierarchy[country]) : [];

export const getDistrictsForState = (country, state) =>
  country && state && locationHierarchy[country]?.[state]
    ? Object.keys(locationHierarchy[country][state])
    : [];

export const getLocationMeta = (country, state, district) =>
  locationHierarchy[country]?.[state]?.[district] || null;

export const cityCoordinates = {
  Delhi: { lat: 28.6139, lng: 77.209 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Mysuru: { lat: 12.2958, lng: 76.6394 }
};
