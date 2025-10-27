import React, { useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import WindCompass from './components/WindCompass';
import MapView from './components/MapView';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;


function clampNumber(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isValidLatitude(n) {
  return n !== null && !Number.isNaN(n) && n >= -90 && n <= 90;
}

function isValidLongitude(n) {
  return n !== null && !Number.isNaN(n) && n >= -180 && n <= 180;
}

function msToKmh(m) {
  return m * 3.6;
}

function findNearestIndex(times = [], targetIso) {
  if (!times || times.length === 0 || !targetIso) return -1;
  const target = new Date(targetIso).getTime();
  let bestIdx = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i]).getTime();
    const diff = Math.abs(t - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function App() {
  const [latitude, setLatitude] = useState('-34.6037');
  const [longitude, setLongitude] = useState('-58.3816');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);
  // validation messages are computed (pure) to avoid triggering state updates during render
  const [windUnit, setWindUnit] = useState('km/h'); // default to km/h
  const latRef = useRef(null);
  const lonRef = useRef(null);

  const validateCoords = (latStr, lonStr) => {
    const lat = clampNumber(latStr);
    const lon = clampNumber(lonStr);
    return isValidLatitude(lat) && isValidLongitude(lon);
  };

  const getLatErrorMsg = (latStr) => {
    const lat = clampNumber(latStr);
    return isValidLatitude(lat) ? '' : 'Latitude must be a number between -90 and 90';
  };

  const getLonErrorMsg = (lonStr) => {
    const lon = clampNumber(lonStr);
    return isValidLongitude(lon) ? '' : 'Longitude must be a number between -180 and 180';
  };

  const fetchWeather = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setWeather(null);

    const ok = validateCoords(latitude, longitude);
    if (!ok) {
      setError('Please fix latitude/longitude values before submitting.');
      // focus first invalid
      const lat = clampNumber(latitude);
      const lon = clampNumber(longitude);
      if (!isValidLatitude(lat) && latRef.current) latRef.current.focus();
      else if (!isValidLongitude(lon) && lonRef.current) lonRef.current.focus();
      return;
    }

    setLoading(true);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
        latitude
      )}&longitude=${encodeURIComponent(
        longitude
      )}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`;

      const res = await axios.get(url);
      const data = res.data || {};
      const current = data.current_weather || null;
      let humidity = null;

      if (data.hourly && current) {
        const times = data.hourly.time || [];
        const humidities = data.hourly.relativehumidity_2m || [];
        // try exact match first
        let idx = times.indexOf(current.time);
        if (idx === -1) {
          // fallback to nearest hour
          idx = findNearestIndex(times, current.time);
        }
        if (idx !== -1 && humidities[idx] !== undefined) humidity = humidities[idx];
      }

      setWeather({
        temperature: current ? current.temperature : null,
        windspeed: current ? current.windspeed : null,
        winddirection: current ? current.winddirection : null,
        time: current ? current.time : null,
        humidity,
      });
    } catch (err) {
      console.error(err);
      setError('Failed to fetch weather. Check the coordinates and your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        setWeather(null);
      },
      (err) => {
        setError('Unable to retrieve your location.');
        console.error(err);
      }
    );
  };

  const canSubmit = () => {
    return validateCoords(latitude, longitude) && !loading;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>React Weather (Open-Meteo)</h1>
        <p>Enter latitude and longitude to fetch current weather (temperature, wind, humidity)</p>

        <form onSubmit={fetchWeather} className="coords-form" aria-label="Weather coordinates form">
          <label htmlFor="latitude-input">
            Latitude
            <input
              id="latitude-input"
              ref={latRef}
              type="text"
              inputMode="decimal"
              aria-required="true"
              aria-describedby="lat-help"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. -34.6037"
            />
            {getLatErrorMsg(latitude) && (
              <div id="lat-help" className="validation" role="alert">
                {getLatErrorMsg(latitude)}
              </div>
            )}
          </label>

          <label htmlFor="longitude-input">
            Longitude
            <input
              id="longitude-input"
              ref={lonRef}
              type="text"
              inputMode="decimal"
              aria-required="true"
              aria-describedby="lon-help"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. -58.3816"
            />
            {getLonErrorMsg(longitude) && (
              <div id="lon-help" className="validation" role="alert">
                {getLonErrorMsg(longitude)}
              </div>
            )}
          </label>

          <div className="buttons">
            <button type="submit" disabled={!canSubmit()} aria-label="Get weather">
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  <span className="sr-only">Loading</span>
                </>
              ) : (
                'Get Weather'
              )}
            </button>
            <button type="button" onClick={() => {
                setLatitude('-34.6037');
                setLongitude('-58.3816');
                setWeather(null);
                setError(null);
              }}>
              Reset
            </button>
            <button type="button" onClick={handleGeolocate} title="Use browser geolocation">
              Use my location
            </button>
          </div>
        </form>

        <div className="unit-row">
          <label>
            <input
              type="radio"
              name="windUnit"
              checked={windUnit === 'm/s'}
              onChange={() => setWindUnit('m/s')}
            />
            m/s
          </label>
          <label>
            <input
              type="radio"
              name="windUnit"
              checked={windUnit === 'km/h'}
              onChange={() => setWindUnit('km/h')}
            />
            km/h
          </label>
        </div>

        {error && (
          <div className="error" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        {weather && (
          <div className="weather-card" role="status" aria-live="polite">
            <h2>Current weather at {weather.time}</h2>
            <ul>
              <li>Temperature: {weather.temperature ?? 'N/A'} °C</li>
              <li>
                Wind speed:{' '}
                {weather.windspeed !== null ? (
                  <>{windUnit === 'm/s' ? `${weather.windspeed} m/s` : `${msToKmh(weather.windspeed).toFixed(1)} km/h`}</>
                ) : (
                  'N/A'
                )}
              </li>
              <li>
                Wind direction: {weather.winddirection ?? 'N/A'} °
                <div className="compass-container" style={{display: 'inline-block', marginLeft: 12}}>
                  <WindCompass direction={weather.winddirection ?? 0} size={72} />
                </div>
              </li>
              <li>Humidity: {weather.humidity ?? 'N/A'} %</li>
            </ul>
            {/* Map (Bing Maps) - requires REACT_APP_BING_MAPS_KEY in .env */}
            <div style={{ marginTop: 12 }}>
              <MapView latitude={latitude} longitude={longitude} />
            </div>
          </div>
        )}

        <footer style={{ marginTop: 20 }}>
          <small>Powered by Open-Meteo (no authentication required)</small>
        </footer>
  </header>
    </div>
  );
}

export default App;
