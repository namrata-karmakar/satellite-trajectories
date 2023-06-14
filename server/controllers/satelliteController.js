import SatelliteService from '../services/satelliteService.js';

class SatelliteController {

    // Controller action to predict satellite orbit
    static async predictSatellitePositionsForStarlink(req, res) {
        try {
            const satelliteService = new SatelliteService();
            const orbitPrediction = await satelliteService.predictSatellitePositionsForStarlink();
            res.json(orbitPrediction);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred while predicting satellite location.' });
        }
    };

    // Controller action to predict satellite orbit
    static async predictSatellitePositionById(req, res) {
        try {
            const satelliteService = new SatelliteService();
            const satelliteId = req.params.id;
            const orbitPrediction = await satelliteService.predictSatellitePositionById(satelliteId);
            res.json(orbitPrediction);   
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred while predicting satellite location.' });
        }
    };

   //Controller action to measure distance between satellites
    static async measureDistanceBetweenTwoSatellites(req,res){
        try {
            const satelliteService = new SatelliteService();
            const { satelliteId1, satelliteId2 } = req.params;
            const distance = await satelliteService.measureDistanceBetweenTwoSatellites(satelliteId1, satelliteId2);
            res.json(distance);  
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred while measuring distance' });
          }
    }

    static async updateStarlinkGroundStationRelationships(req, res) {
        try {
            const satelliteService = new SatelliteService();
            const response = await satelliteService.updateStarlinkGroundStationRelationships();
            res.json(response);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred while updating.' });
            
        }
    }

    static async getAllStarlinkGroundStationCountry(req, res) {
        try {
            const satelliteService = new SatelliteService();
            const response = await satelliteService.getAllStarlinkGroundStationCountry();
            res.json(response);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'An error occurred while getting data' });
        }
    }
}

export default SatelliteController;