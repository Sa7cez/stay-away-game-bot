const mongoose = require('mongoose')

const sessionSchema = new mongoose.Schema({
    key: { type: String },
    data: Object
});

module.exports = mongoose.model('Session', sessionSchema);
