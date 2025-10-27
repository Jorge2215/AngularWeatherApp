import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, Marker, useMap } from 'react-leaflet';

// convert meters to degrees (approx)
function metersToDegrees(lat, meters) {
  const km = meters / 1000;
  const latDeg = km / 111.32;
  const lonDeg = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  return { latDeg, lonDeg };
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !bounds) return;
    try {
      map.fitBounds(bounds, { padding: [20, 20] });
    } catch (e) {
      // ignore fit errors
    }
  }, [map, bounds]);
  return null;
}

const MapView = ({ latitude, longitude, sizeKm = 20 }) => {
  const latNum = Number.parseFloat(latitude);
  const lonNum = Number.parseFloat(longitude);

  // Move bounds calculation into useMemo hook - always called
  const bounds = useMemo(() => {
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      return null;
    }

    const halfSideMeters = (Number(sizeKm) * 1000) / 2;
    const { latDeg, lonDeg } = metersToDegrees(latNum, halfSideMeters);
    const north = latNum + latDeg;
    const south = latNum - latDeg;
    const east = lonNum + lonDeg;
    const west = lonNum - lonDeg;

    return [
      [south, west],
      [north, east]
    ];
  }, [latNum, lonNum, sizeKm]);

  // Early return after hooks
  if (!bounds) {
    return <div className="map-container" style={{ width: 320, height: 240 }}>Invalid coordinates</div>;
  }

  return (
    <div className="map-container" style={{ width: '100%', height: 360 }}>
      <MapContainer center={[latNum, lonNum]} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Rectangle bounds={bounds} pathOptions={{ color: '#0078ff', weight: 2, fillOpacity: 0.12 }} />
        <Marker position={[latNum, lonNum]} />
        <FitBounds bounds={bounds} />
      </MapContainer>
    </div>
  );
};

export default MapView;
