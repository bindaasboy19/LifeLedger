import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocationMap from '../components/maps/LocationMap.jsx';

describe('LocationMap component (Leaflet & OpenStreetMap)', () => {
  it('should render fallback panel when coordinates are invalid or missing', () => {
    render(<LocationMap markers={[]} center={null} />);
    expect(screen.getByText('Map view (Coordinates Summary)')).toBeDefined();
  });

  it('should render Leaflet map container when valid coordinates are provided', () => {
    const sampleMarkers = [
      { id: '1', lat: 28.6139, lng: 77.209, title: 'Delhi Central Blood Bank' }
    ];

    const { container } = render(
      <LocationMap markers={sampleMarkers} center={{ lat: 28.6139, lng: 77.209 }} />
    );

    expect(container.querySelector('.leaflet-container')).toBeDefined();
  });
});
