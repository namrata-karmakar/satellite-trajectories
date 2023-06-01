const { Router } = require("express")
const { SatelliteController } = require('../controllers/satelliteController');

class SatelliteRoutes {
    static getRouter() {
        const router = Router();

        // Route for getting satellite information
        router.get('/id/:id', SatelliteController.getSatelliteInfo);

        // Route for predicting satellite position
        router.get('predictSatellitePosition/id/:id/', SatelliteController.predictSatellitePositionById);

        return router;
    }
}

module.exports = { SatelliteRoutes }
