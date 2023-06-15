import React, { useEffect, useState } from 'react'
import './SatelliteDistanceCalculate.css'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import SelectDropdown from '../SelectDropdown';
// import {FormControl,Select, MenuItem, InputLabel} from '@mui/material' 
import axios from "axios"
import L from "leaflet"
import { Button } from 'semantic-ui-react';


const SatelliteDistanceCalculate = () => {
    const [satelliteData, setSatelliteData] = useState([{ key: "NA", value: null, text: "Not available" }])
    const [satellite1, setSatellite1] = useState(null)
    // const [satellite1coords, setSatellite1Coords] = useState([])
    // const [satellite2coords, setSatellite2Coords] = useState([])
    const [satellite2, setSatellite2] = useState(null)
    const [distance, setDistance] = useState(null)

    const icon = new L.Icon({
        iconUrl: require('../../assets/satellite-icon.png'),
        iconSize: [20, 26]
    })

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

    const getSelectedSatellite1 = (val) => {
        if (val) {

            axios.get(`http://localhost:3000/api/predictSatellitePosition/norad_cat_id/${val}`).then(res => {
                const { latitude, longitude, noradCatId } = res.data
                setSatellite1({
                    coord: [latitude, longitude],
                    noradCatId
                })
                console.log(satellite1)
            }).catch(err => console.log(err.message))
        };
    }
    const getSelectedSatellite2 = (val) => {
        if (val) {

            axios.get(`http://localhost:3000/api/predictSatellitePosition/norad_cat_id/${val}`).then(res => {
                const { latitude, longitude, noradCatId } = res.data
                setSatellite2({
                    "coord": [latitude, longitude],
                    noradCatId
                })
            }).catch(err => console.log(err.message))
        }
    };

    const getDistance = () => {
        if (satellite1 && satellite2) {

            axios.get(`http://localhost:3000/api//measureDistance/satelliteId1/${satellite1.noradCatId}/satelliteId2/${satellite2.noradCatId}`).then(res => {
                setDistance(res.data.distance)
                console.log("distance", distance)
            }).catch(err => console.log(err.message))
        };
    }

    // const polyLocations = [satellite1.coords, satellite2.coords];
    // console.log("polyLocations",polyLocations)
    const polyOptions = { color: 'green', weight: 2 }

    return (
        <div className='distanceContainer'>
             <div className='calculateDistance'>
                        <h1 className='calculateDistanceTitle'>Calculate distance between two satellites</h1>
                <div>
                    <SelectDropdown sendVal={getSelectedSatellite1} values={satelliteData} />
                    <SelectDropdown sendVal={getSelectedSatellite2} values={satelliteData} />
                    <Button primary onClick={getDistance}>Submit</Button>
                    <h2 className='distance'>Distance calculated: {distance && <p>{distance}</p>}</h2>   
                </div>
                
                </div>
                <div style={{ width: '70%', height: '480px' }}>
               <MapContainer center={[49.4979, 8.4682]} zoom={0} style={{ width:'100%', height: '100%' }}>
                   <TileLayer
                       attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                   />
                   {satellite1 && <Marker position={satellite1.coord} icon={icon}>
                       <Popup>
                        <p>NoradCatId:{satellite1.noradCatId}</p>
                        <p>Coordinates:{satellite1.coord}</p>
                       </Popup>
                   </Marker>}
                   {satellite2 && <Marker position={satellite2.coord} icon={icon}>
                       <Popup>
                       <p>NoradCatId:{satellite2.noradCatId}</p>
                        <p>Coordinates:{satellite2.coord}</p>
                       </Popup>
                   </Marker>}
                   {distance && <Polyline positions={[satellite1.coord, satellite2.coord]} pathOptions={polyOptions}>
                       <Popup>{distance}</Popup>
                   </Polyline>}
               </MapContainer>
               </div>  
               </div>
            
    )

}

export default SatelliteDistanceCalculate;
