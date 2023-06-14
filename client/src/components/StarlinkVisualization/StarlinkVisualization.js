import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from "leaflet";

const StarlinkVisualization = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/getAllStarlinkGroundStationCountry');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const renderSatellites = () => {
    const satellites = {};

    data.forEach(item => {
      const { satellite, groundStation, country } = item;
      const satelliteId = satellite.noradCatId;

      if (satellites[satelliteId]) {
        satellites[satelliteId].groundStations.push({
          name: groundStation.name,
          country: country.name,
        });
      } else {
        satellites[satelliteId] = {
          satellite,
          groundStations: [{
            name: groundStation.name,
            country: country.name,
          }],
        };
      }
    });

    return Object.values(satellites).map(({ satellite, groundStations }) => (
      <Marker
        key={`satellite-${satellite.noradCatId}`}
        position={[satellite.latitude, satellite.longitude]}
        icon={satelliteMarkerIcon}
      >
        <Popup>
          <b>{satellite.name.trim()}</b>
          <br />
          Norad Cat ID: {satellite.noradCatId.trim()}
          <br />
          Ground Stations:
          <ul>
            {groundStations.map(groundStation => (
              <li key={`groundstation-${groundStation.name}`}>
                {groundStation.name.trim()}, {groundStation.country.trim()}
              </li>
            ))}
          </ul>
        </Popup>
      </Marker>
    ));
  };

  const renderGroundStations = () => {
    const uniqueGroundStations = {};

    data.forEach(item => {
      const { groundStation } = item;
      const groundStationId = groundStation.id;

      if (!uniqueGroundStations[groundStationId]) {
        uniqueGroundStations[groundStationId] = groundStation;
      }
    });

    return Object.values(uniqueGroundStations).map(groundStation => (
      <Marker
        key={`groundstation-${groundStation.id}`}
        position={[groundStation.latitude, groundStation.longitude]}
        icon={groundStationMarkerIcon}
      >
        <Popup>
          <b>{groundStation.name.trim()}</b>
          <br />
          Country: {groundStation.countryCode.trim()}
        </Popup>
      </Marker>
    ));
  };

  const renderConnections = () => {
    return data.map(item => {
      const { satellite, groundStation } = item;

      return (
        <Polyline
          key={`connection-${satellite.noradCatId}-${groundStation.id}`}
          positions={[
            [satellite.latitude, satellite.longitude],
            [groundStation.latitude, groundStation.longitude],
          ]}
          color="black"
          weight={1} opacity={0.5}
        />
      );
    });
  };

  // Custom marker icons
  const satelliteMarkerIcon = new Icon({
    iconUrl: require('../../assets/satellite-icon.png'),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })

  const groundStationMarkerIcon = new Icon({
    iconUrl: require('../../assets/download.jpeg'),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })

  return (
    <div style={{ height: '700px' }}>
      <MapContainer center={[49.4979, 8.4682]} zoom={8} style={{ height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {renderSatellites()}
        {renderGroundStations()}
        {renderConnections()}
      </MapContainer>
    </div>
  );
};

export default StarlinkVisualization;