import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Polyline } from 'react-leaflet';
import './IssLiveLocation.css'

const IssLiveLocation = () => {
    console.log("iss position reset...")
  const [selected, setSelected] = useState("");
  const [latestRecordsArray, setLatestRecordsArray] = useState([])
  const [issPosition, setIssPosition] = useState(['-38.3944', '122.9835'])
  const myIcon = new L.Icon({
    iconUrl: require('../../assets/satellite-iss.png'),
    iconSize: [60, 60],
});

const multilocation = new L.Icon({
  iconUrl: require('../../assets/space-station.png'),
  iconSize: [26, 26],
});

const mapRef = useRef(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      console.log('This will run every thirty second!');
      fetchData();
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('This will run every 2 minute!');
      fetchLatestRecords();
    }, 120000);
    return () => clearInterval(interval);
    
  }, [])

  const polylinePositions = latestRecordsArray.map(record => [record[0], record[1]]);
  const polylineOptions = { color: 'white', weight:1 };

  const fetchLatestRecords = async () => {
    try {
      const latestRecordsResponse = await axios.get("http://localhost:3001/records")
      .then(latestRecordsResponse => {
        const objArray = latestRecordsResponse.data
        const arrayOfArrays = objArray.map(obj => Object.values(obj));
        console.log("arrayOfArrays--:",arrayOfArrays)
        setLatestRecordsArray(arrayOfArrays)
      console.log("latestRecordsResponse--->",latestRecordsResponse)
      .catch(error => {
        console.error('Error making first API request:', error);
      });
    })
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

  const fetchData = async () => {
    try {
      console.log('Fetching data from API...');
      const response = await axios.get('http://localhost:3001/location')
      .then(response => {
        console.log("Response", response.data)
        let myResponse = response.data;
        setIssPosition(myResponse)
        console.log("issPosition in fetch...",issPosition)
      })
      .catch(error => {
        console.error('Error making first API request:', error);
      });
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  const changeHandler = e => {
    console.log("Selected option is:", e.target.value)
    setSelected(e.target.value);
  };

  useEffect(() => {
    console.log('issPosition...', issPosition);
    if (mapRef.current) {
      mapRef.current.setView(issPosition, mapRef.current.getZoom());
    }
  }, [issPosition]);

  return (
    <div className="App">
      <div className='radioButtonDiv'>
      <div className='liveLocationRadio'>
        <input type="radio" name="live-location" value="live-location" checked={selected === "live-location"} onChange={changeHandler} />
        <label className='labelClass' htmlFor="client">Live location</label>
      </div>
      <div className='historyTrackRadio'>
        <input type="radio" name="track" value="track" checked={selected === "track"} onChange={changeHandler} />
        <label className='labelClass' htmlFor="client">Show previous locations</label>
      </div>
      </div>
      {selected === "live-location" ?
      <div>
        <h5 className='latLongDataHeading'>ISS-Live-Location Latitude: {issPosition[0]}, Longitude: {issPosition[1]}</h5>
        <MapContainer center={issPosition} zoom={3} style={{ height: '568px', width: '100%' }}>
        <TileLayer
          attribution="Map data &copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        <Marker position={issPosition} icon={myIcon}>
          <Popup>
            Latitude: {issPosition[0]} Longitude: {issPosition[1]}
          </Popup>
        </Marker>
        </MapContainer></div> :null
      }
      {selected === "track" ?
      <div>
        <h5 className='latLongDataHeading'>ISS-Live-Location Latitude: {issPosition[0]}, Longitude: {issPosition[1]}</h5>
        <MapContainer center={issPosition} zoom={6} style={{ height: '568px', width: '100%' }}>
        <TileLayer
          attribution="Map data &copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {latestRecordsArray.map((item, index) => (
          <Marker position={latestRecordsArray[index]} icon={multilocation}>
        </Marker>
        ))}
        <Polyline positions={polylinePositions} pathOptions={polylineOptions} />
        
        </MapContainer></div> :null
      }
      
    </div>
  );
};
export default IssLiveLocation;
