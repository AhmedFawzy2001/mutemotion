const mongoose = require('mongoose');
const transportSchema = new mongoose.Schema({
    location: String,
    destination: String,
    dateTime: Date,
    expectedCost: Number,
    paymentMethod: { type: String, enum: ['cash', 'credit card'] },
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'passenger' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'driver', default: null },
    is_taken: { type: Boolean, default: false }
});
const Transport = mongoose.model('Transport', transportSchema);
module.exports = Transport;