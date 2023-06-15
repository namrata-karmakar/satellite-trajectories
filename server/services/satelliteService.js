
import fetch from 'node-fetch';
import satellite from 'satellite.js';
import { MongoClient } from 'mongodb';
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
            });
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
                const satelliteLocation = this.predictSatellitePosition(tleLine0, tleLine1, tleLine2);
                await this.saveLocationRecord(satelliteLocation);
                return satelliteLocation;
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
        const satelliteLocation = {
            noradCatId: noradCatId,
            satellite: tle0,
            latitude: latitudeDeg,
            longitude: longitudeDeg,
            timestamp: new Date()
        }
        return satelliteLocation;
    }

    async saveLocationRecord(satelliteLocation) {
        const mongo_url = process.env.MONGODB_URI;
        const dbName = 'satellite-trajectories';
        const client = new MongoClient(mongo_url);
        await client.connect()
        const db = client.db(dbName);
        const collection = db.collection('satellite-location');

        const filter = { noradCatId: satelliteLocation.noradCatId };
        const update = { $set: satelliteLocation };
        const options = { upsert: true };
        const record = await collection.findOneAndUpdate(filter, update, options);
        if (record.ok) {
            if (record.lastErrorObject.updatedExisting) {
                console.log('Location record updated successfully.');
            } else {
                console.log('Location record inserted successfully.');
            }
        } else {
            throw new Error('Failed to save or update location record.');
        }
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
            await this.deleteStarlinkGroundStationRelationships();
            await this.updateStarlinkPositionsInNeo4j();
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
            const data = records.map(record => ({
                satellite: record.get('s').properties,
                groundStation: record.get('g').properties,
                country: record.get('c').properties
            }));
            return data;
        } catch (error) {
            throw error;
        } finally {
            session.close();
        }
    }

    async measureDistanceBetweenTwoSatellites(id1, id2) {
        const location1 = await this.getLocation(parseInt(id1));
        const location2 = await this.getLocation(parseInt(id2));

        const lat1 = location1.latitude;
        const lon1 = location1.longitude;
        const lat2 = location2.latitude;
        const lon2 = location2.longitude;

        function measureDistance(lat1, lon1, lat2, lon2) {
            const earthRadius = 6371; // Radius of the Earth in kilometers

            // Convert latitude and longitude to radians
            const dLat = satellite.degreesToRadians(lat2 - lat1);
            const dLon = satellite.degreesToRadians(lon2 - lon1);
            const dLat1Rad = satellite.degreesToRadians(lat1);
            const dLat2Rad = satellite.degreesToRadians(lat2);

            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(dLat1Rad) *
                Math.cos(dLat2Rad) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            const distance = earthRadius * c; // Distance in kilometers
            return distance;
        }

        const calcdistance = measureDistance(lat1, lat2, lon1, lon2);

        const distance = {
            satellite1Id: id1,
            satellite2Id: id2,
            distance: calcdistance,
            timestamp: new Date()
        }
        await this.saveDistanceRecord(distance);
        return distance


    }

    async saveDistanceRecord(distance) {
        const mongo_url = process.env.MONGODB_URI;
        const dbName = 'satellite-trajectories';
        const client = new MongoClient(mongo_url);
        await client.connect()

        const db = client.db(dbName);
        const collection = db.collection('satellite-distance');

        const filter = { satellite1Id: distance.satellite1Id, satellite2Id: distance.satellite2Id };
        const update = { $set: distance };
        const options = { upsert: true };


        const record = await collection.findOneAndUpdate(filter, update, options);

        if (record.ok) {
            if (record.lastErrorObject.updatedExisting) {
                console.log('Distance record updated successfully.');
            } else {
                console.log('Distance record inserted successfully.');
            }
        } else {
            throw new Error('Failed to save or update distance record.');
        }

    }



    async getLocation(id) {
        try {
            const mongo_url = process.env.MONGODB_URI;
            const dbName = 'satellite-trajectories';
            const client = new MongoClient(mongo_url);
            await client.connect()

            const db = client.db(dbName);
            const collection = db.collection('satellite-location');


            const query = { noradCatId: id };
            const projection = { _id: 0, latitude: 1, longitude: 1 };

            const result = await collection.findOne(query, { projection });

            return result;
        }
        catch (error) {
            console.error('Failed to get the location', error.message);
            throw error;

        }
    }

    async getAllSatellitesData() {
        try {
            const mongo_url = process.env.MONGODB_URI;
            const dbName = 'satellite-trajectories';
            const client = new MongoClient(mongo_url);

            await client.connect();

            const db = client.db(dbName);
            const collection = db.collection('satellite_data');

            //   // Retrieve all documents from the "satellite_data" collection
            //   const data = await collection.find().toArray();

            const query = {};
            const projection = { _id: 0, NORAD_CAT_ID: 1, OBJECT_NAME: 1 };

            const data = await collection.find(query, { projection }).toArray();

            return data;
        } catch (error) {
            console.error('Error retrieving satellite data:', error);
            throw error;
        }
    }




}
export default SatelliteService;