const { SatelliteService } = require('../services/satelliteService');

class SatelliteController {

    // Controller action to get satellite information
    static async getSatelliteInfo(req, res) {
        try {
            const satelliteService = new SatelliteService();
            const satelliteId = req.params.id;
            const satelliteInfo = await satelliteService.getSatelliteInfo(satelliteId);
            res.json(satelliteInfo);
        } catch (error) {
            res.status(500).json({ error: 'An error occurred while fetching satellite information.' });
        }
    };

    // Controller action to predict satellite orbit
    static async predictSatellitePositionById(req, res) {
        try {
            const satelliteService = new SatelliteService();
            const satelliteId = req.params.id;
            console.log("controller", satelliteId);
            const orbitPrediction = await satelliteService.predictSatellitePositionById(satelliteId);
            res.json(orbitPrediction);
        } catch (error) {
            res.status(500).json({ error: 'An error occurred while predicting satellite location.' });
        }
    };
}

module.exports = { SatelliteController }