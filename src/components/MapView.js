import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Rectangle, Marker } from 'react-leaflet';

// Convert meters to degrees approx at given latitude
function metersToDegrees(lat, meters) {
  const km = meters / 1000;
  const latDeg = km / 111.32; // approx km per degree latitude
  const lonDeg = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  return { latDeg, lonDeg };
}

const MapView = ({ latitude, longitude }) => {
  const latNum = Number.parseFloat(latitude);
  const lonNum = Number.parseFloat(longitude);

  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    return <div className="map-container" style={{ width: 320, height: 240 }}>Invalid coordinates</div>;
  }

  // 20km x 20km square centered on coords (so half-side = 10 km)
  const halfSideMeters = 10000;
  const { latDeg, lonDeg } = metersToDegrees(latNum, halfSideMeters);
  const north = latNum + latDeg;
  const south = latNum - latDeg;
  const east = lonNum + lonDeg;
  const west = lonNum - lonDeg;

  // Leaflet Rectangle expects [[southWest], [northEast]]
  const bounds = useMemo(() => [[south, west], [north, east]], [south, west, north, east]);

  return (
    <div className="map-container" style={{ width: 320, height: 240 }}>
      <MapContainer center={[latNum, lonNum]} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Rectangle bounds={bounds} pathOptions={{ color: '#0078ff', weight: 2, fillOpacity: 0.12 }} />
        <Marker position={[latNum, lonNum]} />
      </MapContainer>
    </div>
  );
};

export default MapView;
