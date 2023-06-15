import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from "leaflet"
import axios from "axios"
import SelectDropdown from '../SelectDropdown';
import { Button } from 'semantic-ui-react';

const SatelliteNotInOrbit = () => {
    const [satelliteData, setSatelliteData] = useState([{ key: "NA", value: null, text: "Not available" }])
    const [residual, setResidual] = useState(null)
    const [satellite, setSatellite] = useState(null)

    const icon = new L.Icon({
        iconUrl: require('../../assets/satellite-icon.png'),
        iconSize: [20, 26]
    })
    const polyOptions = { color: 'green', weight: 2 }

    useEffect(() => {
        async function fetchData() {
            await axios.get("http://localhost:3000/api/getActiveSatellitesData").then((res) => {
                const options = res.data.map((item => {
                    return {
                        key: item.NORAD_CAT_ID,
                        value: item.NORAD_CAT_ID,
                        text: item.OBJECT_NAME
                    }
                }))
                setSatelliteData(options)
            }).catch(err => console.log(err.message))
        }
        fetchData()
    }, [])

    const getSelectedSatellite = (val) => {
        if (val) {
            axios.get(`http://localhost:3000/api/getGroundStationPosition/id/${val}`)
                .then(res => {
                    const { Norad_Cat_id, Last_timestamp, } = res.data[0];
                    const lastLat = res.data[0]['Last_Latitude(Degrees)'];
                    const lastLong = res.data[0]['Last_Longitude(Degrees)'];
                    const latestLat = res.data[0]['Latest_Latitude(Degrees)'];
                    const latestLong = res.data[0]['Latest_Longitude(Degrees)'];
                    setSatellite({
                        coord1: [lastLat, lastLong],
                        coord2: [latestLat, latestLong],
                        Norad_Cat_id, Last_timestamp
                    })
                }).catch(err => console.log(err.message))
        };
    }

    const getResiduals = () => {
        if (satellite) {
            axios.get(`http://localhost:3000/api/getResiduals/id/${satellite.Norad_Cat_id}/timestamp/${satellite.Last_timestamp}`).then(res => {
                setResidual(res.data)
            }).catch(err => console.log(err.message))
        };
    }

    return (
        <div className='container'>
            <div style={{ width: '80%', height: '400px' }}>
                <MapContainer center={[49.4979, 8.4682]} zoom={0} style={{ height: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {satellite && <Marker position={satellite.coord1} icon={icon}>
                        <Popup>Position 1</Popup>
                    </Marker>}
                    {satellite && <Marker position={satellite.coord2} icon={icon}>
                        <Popup>Position 2</Popup>
                    </Marker>}
                    {residual && <Polyline positions={[satellite.coord1, satellite.coord2]} pathOptions={polyOptions}>
                        <Popup>{residual}</Popup>
                    </Polyline>}
                </MapContainer>
            </div>
            <h1 className='title'>Is the satellite in orbit?</h1>
            <div>
                <SelectDropdown sendVal={getSelectedSatellite} values={satelliteData} />
                <Button primary onClick={getResiduals}>Submit</Button>
                {residual && <p>{residual}</p>}
            </div>
        </div>
    )

};

export default SatelliteNotInOrbit;