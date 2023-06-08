import fetch from 'node-fetch';
import satellite from 'satellite.js';
import SatelliteModel from '../models/satelliteModel.js';

class SatelliteService {

    async predictSatellitePositionsForStarlink() {
        try {
            const data = await this.getCelestrakData();
            const tleSets = await this.processCelestrakData(data);
            const starlinkPositions = [];
            tleSets.forEach((tleSet) => {
                if (!undefined) {
                    const position = this.predictSatellitePosition(tleSet[0], tleSet[1], tleSet[2]);
                    starlinkPositions.push(position);
                }
            })
            return starlinkPositions;
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }

    async predictSatellitePositionById(satelliteId) {
        const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${satelliteId}`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.text();
                const tleLines = data.split('\n');
                const tleSet = tleLines.slice(0, 3);
                const cleanedTLESet = tleSet.map(line => line.replace('\r', ''));
                const tleLine0 = cleanedTLESet[0];
                const tleLine1 = cleanedTLESet[1];
                const tleLine2 = cleanedTLESet[2];
                return this.predictSatellitePosition(tleLine0, tleLine1, tleLine2);
            } else {
                throw new Error(`Request failed with status code ${response.status}`);
            }
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }

    predictSatellitePosition(tle0, tle1, tle2) {

        // Parse TLE data
        const satrec = satellite.twoline2satrec(tle1, tle2);

        // Generate satellite position at current time
        const positionAndVelocity = satellite.propagate(satrec, new Date());

        const positionEci = positionAndVelocity.position;

        var gmst = satellite.gstime(new Date());

        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        const longitude = positionGd.longitude,
            latitude = positionGd.latitude;

        //  Convert the RADIANS to DEGREES.
        const longitudeDeg = satellite.degreesLong(longitude),
            latitudeDeg = satellite.degreesLat(latitude);
        // console.log("Satellite", tle0);
        // console.log("longitudeDeg", longitudeDeg);
        // console.log("latitudeDeg", latitudeDeg);
        // console.log('------------------------');
        const satellitePosition = {
            satellite: tle0,
            latitude: latitudeDeg,
            longitude: longitudeDeg
        }
        return satellitePosition;
    }

    async processCelestrakData(data) {
        try {
            const tleLines = data.split('\n');
            const tleSets = [];
            for (let i = 0; i < tleLines.length; i += 3) {
                const tleSet = tleLines.slice(i, i + 3);
                    tleSets.push(tleSet);
            }
            const cleanedTleSets = [];
            tleSets.forEach(tleSet => {
                const cleanedTLESet = tleSet.map(line => line.replace('\r', ''));
                cleanedTleSets.push(cleanedTLESet);
            });
            return cleanedTleSets;
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }

    async getCelestrakData() {
        const fileName = 'starlink';
        const url = `https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=${fileName}&FORMAT=tle`;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.text();
                return data.trim();
            } else {
                throw new Error(`Request failed with status code ${response.status}`);
            }
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }

}

export default SatelliteService;