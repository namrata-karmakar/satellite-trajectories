import mongoose from 'mongoose';

const satelliteSchema = new mongoose.Schema({
  satellite_id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
  },
  // Other satellite properties
});

const SatelliteModel = mongoose.model('Satellite', satelliteSchema);

export default SatelliteModel;
