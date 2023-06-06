import { Router } from "express";
import SatelliteController from '../controllers/satelliteController.js';

class SatelliteRoutes {
    static getRouter() {
        const router = Router();

        // Route for predicting positions of all Starlink satellites
        router.get('/predictSatellitePosition/starlink', SatelliteController.predictSatellitePositionsForStarlink);

        // Route for predicting satellite position
        router.get('/predictSatellitePosition/norad_cat_id/:id', SatelliteController.predictSatellitePositionById);

        return router;
    }
}

export default SatelliteRoutes;