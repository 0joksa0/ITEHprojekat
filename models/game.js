const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const gameSchema = new Schema({
    player1:{},
    player1socket:{},
    player2:{},    
    player2socket:{},
    chess:{}
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;