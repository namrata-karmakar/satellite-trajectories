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
        const satrec = satellite.twoline2satrec(tle1, tle2);
        const positionAndVelocity = satellite.propagate(satrec, new Date());
        const positionEci = positionAndVelocity.position;
        var gmst = satellite.gstime(new Date());
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        const longitude = positionGd.longitude,
            latitude = positionGd.latitude;
        const longitudeDeg = satellite.degreesLong(longitude),
            latitudeDeg = satellite.degreesLat(latitude);
        const noradCatId = this.extractNoradCatId(tle2);
        const satellitePosition = {
            noradCatId: noradCatId,
            name: tle0,
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
        try {
            const cypherQuery = `LOAD CSV WITH HEADERS FROM 'https://adb-satellite-project.s3.eu-central-1.amazonaws.com/starlink-satellite-locations.csv' AS row
            MATCH (s:StarlinkSatellite {noradCatId: row.noradCatId})
            SET s.latitude = toFloat(row.latitude), s.longitude = toFloat(row.longitude)`
            await session.run(cypherQuery);
        } catch (error) {
            throw error;
        } finally {
            session.close();
        }
    }

    async deleteStarlinkGroundStationRelationships() {
        const session = driver.session();
        try {
            const cypherQuery = `MATCH (s:StarlinkSatellite)-[oldRel:CLOSEST_TO]->()
            DELETE oldRel`;
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
            const starlinkPositions = await this.predictSatellitePositionsForStarlink();
            await this.updateStarlinkPositionsInNeo4j();
            await this.deleteStarlinkGroundStationRelationships();
            const cypherQuery = `MATCH (s:StarlinkSatellite), (g:GroundStation)
                WITH s, g, point.distance(
                point({latitude: s.latitude, longitude: s.longitude}),
                point({latitude: g.latitude, longitude: g.longitude})
                ) AS dist
                WHERE dist > 100000 AND dist < 500000
                WITH s, g, dist
                MERGE (s)-[:CLOSEST_TO {distance: dist}]->(g)`;
            await session.run(cypherQuery);
            return starlinkPositions;
        } catch (error) {
            throw error;
        } finally {
            session.close();
        }
    }

    async getAllStarlinkGroundStationCountry() {
        const session = driver.session();
        try {
            const cypherQuery = `
                MATCH (s:StarlinkSatellite)-[:CLOSEST_TO]->(g:GroundStation)-[:IN_COUNTRY]->(c:Country)
                RETURN s, g, c
            `;
            const { records } = await session.run(cypherQuery);
            console.log('no. of records', records.length);
            const data = records.map(record => ({
                satellite: record.get('s').properties,
                groundStation: record.get('g').properties,
                country: record.get('c').properties
              }));
            //   console.log('data', data);
            return data;
        } catch (error) {
            throw error;
        } finally {
            session.close();
        }
    }
}

export default SatelliteService;