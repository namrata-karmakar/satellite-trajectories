import SatelliteService from '../services/satelliteService.js';

class SatelliteController {

    // Controller action to predict satellite orbit
    static async predictSatellitePositionsForStarlink(req, res) {
        try {
            const satelliteService = new SatelliteService();
            const orbitPrediction = await satelliteService.predictSatellitePositionsForStarlink();
            res.json(orbitPrediction);
        } catch (error) {
            res.status(500).json({ error: 'An error occurred while predicting satellite location.' });
        }
    };

    // Controller action to predict satellite orbit
    static async predictSatellitePositionById(req, res) {
        try {
            const satelliteService = new SatelliteService();
            const satelliteId = req.params.id;
            console.log("controller");
            const orbitPrediction = await satelliteService.predictSatellitePositionById(satelliteId);
            res.json(orbitPrediction);
        } catch (error) {
            res.status(500).json({ error: 'An error occurred while predicting satellite location.' });
        }
    };
}

export default SatelliteController;