const mongoose = require('mongoose');

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

const Satellite = mongoose.model('Satellite', satelliteSchema);

module.exports = Satellite;
