import fetch from 'node-fetch';
import satellite from 'satellite.js';
import { parse } from 'json2csv';
import UploadToS3Service from './uploadToS3Service.js';
import { promises as fsPromises } from 'fs';
import { driver } from '../app.js';
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
            await this.convertJsonToCsv(starlinkPositions);
            const uploadToS3Service = new UploadToS3Service();
            await uploadToS3Service.uploadCsvToS3('starlink-satellite-locations');
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
        // Initialize a satellite record
        const satrec = satellite.twoline2satrec(tle1, tle2);

        // Propagate satellite using a JavaScript Date
        const positionAndVelocity = satellite.propagate(satrec, new Date());

        // The position_velocity result is a key-value pair of ECI coordinates.
        // These are the base results from which all other coordinates are derived.
        const positionEci = positionAndVelocity.position;

        // You will need GMST for some of the coordinate transforms.
        // http://en.wikipedia.org/wiki/Sidereal_time#Definition
        var gmst = satellite.gstime(new Date());

        // You can get Geodetic coordinates
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        // Geodetic coords are accessed via `longitude`, `latitude`, `height`.
        const longitude = positionGd.longitude,
            latitude = positionGd.latitude;

        //  Convert the RADIANS to DEGREES.
        const longitudeDeg = satellite.degreesLong(longitude),
            latitudeDeg = satellite.degreesLat(latitude);
        // console.log("Satellite", tle0);
        // console.log("longitudeDeg", longitudeDeg);
        // console.log("latitudeDeg", latitudeDeg);
        // console.log('------------------------');

        const noradCatId = this.extractNoradCatId(tle2);

        const satellitePosition = {
            noradCatId: noradCatId,
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
            throw error;
        }
    }

    extractNoradCatId(tle2) {
        const noradCatIdPattern = /^\d+\s(\d+)/;
        const noradCatIdMatch = tle2.match(noradCatIdPattern);
        const noradCatId = noradCatIdMatch ? noradCatIdMatch[1] : null;
        return parseInt(noradCatId);
    }

    async convertJsonToCsv(jsonData) {
        const csvData = parse(jsonData);
        const filePath = 'datasets/starlink-satellite-locations.csv';
        try {
            await fsPromises.writeFile(filePath, csvData);
            console.log(`CSV file has been saved at ${filePath}`);
        } catch (error) {
            throw error;
        }
    }

    async updateStarlinkPositionsInNeo4j() {
        const session = driver.session();
        // let result;
        try {
            const cypherQuery = `LOAD CSV WITH HEADERS FROM 'https://adb-satellite-project.s3.eu-central-1.amazonaws.com/starlink-satellite-locations.csv' AS row
            MATCH (s:starlinkSatellite {noradCatId: row.noradCatId})
            SET s.latitude = toFloat(row.latitude), s.longitude = toFloat(row.longitude)`
            await session.run(cypherQuery);
        } catch (error) {
            throw error;
        } finally {
            session.close();
        }
    }

    async updateStarlinkGroundStationRelationships() {
        const session = driver.session();
        try {
            await this.predictSatellitePositionsForStarlink();
            await this.updateStarlinkPositionsInNeo4j();
            const cypherQuery = `MATCH (s:Satellite)-[r:CLOSEST_TO]->(g:GroundStation)
                DELETE r
                WITH s
                MATCH (s:starlinkSatellite), (g:groundStation)
                WITH s, g, point.distance(
                point({latitude: s.latitude, longitude: s.longitude}),
                point({latitude: g.latitude, longitude: g.longitude})
                ) AS dist
                ORDER BY dist
                WITH s, COLLECT(g) AS closestStations, MIN(dist) AS minDist
                FOREACH (cs IN closestStations[0..1] |
                MERGE (s)-[:CLOSEST_TO {distance: minDist}]->(cs)
                )`
            await session.run(cypherQuery);
        } catch (error) {
            throw error;
        } finally {
            session.close();
        }
    }
}

export default SatelliteService;