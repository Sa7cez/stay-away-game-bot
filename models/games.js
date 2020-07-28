const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    creator: { type: Number, default: null },
    creatorName: { type: String },
    members: Array,
    settings: {
      lock: { type: Boolean, default: false },
      cost: { type: Number, default: 0 },
      silence: { type: Boolean, default: false },
      mode: { type: Number, default: 2 },
      time: { type: Number, default: 30 },
      players: { type: Number, default: 6 }
    },
    
    // Текущая колода
    deck: Array,
    // Сброс
    discard: Array,
    direction: { type: String, default: 'normal' }, //reverse
    created: { type: Date }, 
    start: { type: Date },
    finish: { type: Date },
    winners: Array,
    losers: Array
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Game', gameSchema);
