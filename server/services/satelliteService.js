import fetch from 'node-fetch';
import satellite from 'satellite.js';
import { MongoClient } from 'mongodb';

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

    async predictSatellitePosition(tle0, tle1, tle2) {

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
            const noradCatId = this.extractNoradCatId(tle2);
            const satelliteLocation = {            
                satellite: tle0,
                noradCatId: noradCatId,
                latitude: latitudeDeg,
                longitude: longitudeDeg,
                timestamp: new Date()
            }

        await this.saveLocationRecord(satelliteLocation);
    }


    async  saveLocationRecord(satelliteLocation){
        const mongo_url= process.env.MONGODB_URI;
        const dbName = 'satellite-trajectories';
        const client = new MongoClient(mongo_url);
        await client.connect()
            const db = client.db(dbName);
            const collection = db.collection('satellite-location');

            const filter = { noradCatId: satelliteLocation.noradCatId };
            const update = { $set: satelliteLocation };
            const options = { upsert: true };
            

            const record =  await collection.findOneAndUpdate(filter, update, options);

            if (record.ok) {
                if (record.lastErrorObject.updatedExisting) {
                  console.log('Location record updated successfully.');
                } else {
                  console.log('Location record inserted successfully.');
                }
            }else {
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

    extractNoradCatId(tle2) {
        const noradCatIdPattern = /^\d+\s(\d+)/;
        const noradCatIdMatch = tle2.match(noradCatIdPattern);
        const noradCatId = noradCatIdMatch ? noradCatIdMatch[1] : null;
        return parseInt(noradCatId);
        }


    async  measureDistanceBetweenTwoSatellites(id1, id2) {
            const location1= await this.getLocation(parseInt(id1));
            const location2= await this.getLocation(parseInt(id2));

            const lat1= location1.latitude;
            const lon1=location1.longitude;
            const lat2= location2.latitude;
            const lon2=location2.longitude;

            const calcdistance= measureDistance(lat1,lat2,lon1,lon2);

            const distance={
            satellite1Id:id1,
            satellite2Id:id2,
            distance: calcdistance,
            timestamp: new Date()
            }
            await this.saveDistanceRecord(distance);

        
        

        function measureDistance(lat1, lon1, lat2, lon2) {
            const earthRadius = 6371; // Radius of the Earth in kilometers
          
            // Convert latitude and longitude to radians
            const dLat = satellite.degreesToRadians(lat2 - lat1);
            const dLon = satellite.degreesToRadians(lon2 - lon1);
            const dLat1Rad=satellite.degreesToRadians(lat1);
            const dLat2Rad=satellite.degreesToRadians(lat2);
          
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
        }

        async saveDistanceRecord(distance){
            const mongo_url = process.env.MONGODB_URI;
            const dbName = 'satellite-trajectories';
            const client = new MongoClient(mongo_url);
             await client.connect()
           
              const db = client.db(dbName);
              const collection = db.collection('satellite-distance');
  
              const filter = { satellite1Id: distance.satellite1Id, satellite2Id:distance.satellite2Id };
              const update = { $set: distance };
              const options = { upsert: true };
              
  
              const record =  await collection.findOneAndUpdate(filter, update, options);
  
              if (record.ok) {
                  if (record.lastErrorObject.updatedExisting) {
                    console.log('Distance record updated successfully.');
                  } else {
                    console.log('Distance record inserted successfully.');
                  }
              }else {
                  throw new Error('Failed to save or update distance record.');
                }
  
              }
          
          
    
            async getLocation(id){
                try{
                const mongo_url = process.env.MONGODB_URI;
                const dbName = 'satellite-trajectories';
                const client = new MongoClient(mongo_url);
                await client.connect()
                
                    const db = client.db(dbName); 
                    const collection = db.collection('satellite-location'); 
        
        
                    const query = { noradCatId: id };
                    const projection = { _id: 0, latitude: 1, longitude: 1 };
                    ;
                    const result = await collection.findOne(query, { projection});
                
                    return result;
                }
                catch (error) {
                    console.error('Failed to get the location', error.message);
                    throw error;
    
                }
            }

    
    
}
export default SatelliteService;