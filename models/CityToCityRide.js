const mongoose = require('mongoose');
const cityToCityRideSchema = new mongoose.Schema({
    location: String,
    destination: String,
    dateTime: Date,
    noOfPassengers: Number,
    noOfBags: Number,
    expectedCost: Number,
    paymentMethod: { type: String, enum: ['cash', 'credit card'] },
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'passenger' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'driver', default: null },
    is_taken: { type: Boolean, default: false }
});
const CityToCityRide = mongoose.model('CityToCityRide', cityToCityRideSchema);
module.exports =CityToCityRide ;