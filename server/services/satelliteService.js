const satellite = require('satellite.js');
const Satellite = require('../models/satelliteModel');

class SatelliteService {
    async getSatelliteInfo(satelliteId) {
        try {
            const satellite = await Satellite.findById(satelliteId);
            if (!satellite) {
                throw new Error('Satellite not found');
            }
            return satellite;
        } catch (error) {
            throw new Error('An error occurred while fetching satellite information');
        }
    };

    async predictSatellitePositionById(satelliteId) {
        try {
            // TLE data for the satellite
            // const tleLine1 = tleData.line1;
            // const tleLine2 = tleData.line2;
            const tleLine1 = '1 00900U 64063C   23148.71289205  .00000677  00000+0  70589-3 0  9991';
            const tleLine2 = '2 00900  90.1910  47.4728 0029208  63.3257 350.2265 13.74321843918074';

            // Parse TLE data
            const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

            // Generate satellite position at current time
            const positionAndVelocity = satellite.propagate(satrec, new Date());
            console.log("positionAndVelocity", positionAndVelocity);

            const positionEci = positionAndVelocity.position;
            console.log("positionEci", positionEci);

            var gmst = satellite.gstime(new Date());

            const positionGd = satellite.eciToGeodetic(positionEci, gmst);
            console.log("positionGd", positionGd)

            const longitude = positionGd.longitude,
                latitude = positionGd.latitude;

            //  Convert the RADIANS to DEGREES.
            const longitudeDeg = satellite.degreesLong(longitude),
                latitudeDeg = satellite.degreesLat(latitude);
            console.log("longitudeDeg", longitudeDeg);
            console.log("latitudeDeg", latitudeDeg);
            console.log('------------------------');
        } catch (error) {
            throw new Error('An error occurred while predicting satellite position');
        }
    }
}

module.exports = { SatelliteService }

