const Express = require('express')();
const Http = require('http').Server(Express);
const io = require('socket.io')(Http);

Http.listen(709, () => {
    console.log('Listening at :709...');
});

var position = {
    x: 200,
    y: 200
};

var player1 = {socketId: '', isReady: false};
var player2 = {socketId: '', isReady: false}
var players = 0;
var player_array = [];

// To make this easy, this will be in reference to player1
// i.e.  'true' if it is player 1's turn, 'false' if not
var turn = true;

// Probably an architectural nightmare, but basically this gets changed all the time
//      to whatever the current socket is. That way, I don't have to pass it to
//      my socket wrapper methods
socketReference = {};

io.on('connection', (socket) => {
    socketReference = socket;

    if (player1.socketId === '') {
        player1.socketId = socket.id;
        player_array.push(player1);
        console.log(`player 1 id: ${socket.id}`);
        toSender('connection', {message: 'Welcome to Flog! You are Player 1', player_id: '1'});
    } else {
        player2.socketId = socket.id;
        player_array.push(player2);
        console.log(`player 2 id: ${socket.id}`);
        toSender('connection', {message: 'Welcome to Flog! You are Player 2', player_id: '2'})
    }
    ++players;

    // This triggers whenever a player hits the ready up button.
    //      Make sure the correct player gets readied up
    socket.on('playerReadyUp', function() {
        player_array.find(player => player.socketId === socket.id).isReady = true;

        if (player1.isReady && player2.isReady) {
            toEveryone('startGame', true);
        }
    })

    socket.on('move', data => {
        // Only allow players to do things on their turn
        if (turn && socket.id === player1.socketId || !turn && socket.id === player2.socketId) {
            // When the player is done with their turn, flip the turn boolean
            if (data === 'down'){
                if (turn && socket.id === player1.socketId) {
                    turn = false;
                } else if (!turn && socket.id === player2.socketId) {
                    turn = true;
                }
            }

            console.log(position.x);
            console.log(position.y);
            // Win-condition
            if (position.x === 150 && position.y === 150) {
                winningPlayer = socket.id === player1.socketId ? '1' : '2';

                toSender('winStatus', {message: 'You won! :D', winningPlayer: winningPlayer});
                toAllButSender('winStatus', {message: 'You lost :(', winningPlayer: winningPlayer})
			}
        }
    });

    
    socket.on('disconnect', function() {
        // Decrement the number of players as they leave
        --players;
        // If there are no more players, reset everything for when they join next time
        if (players === 0) {
            reset(resetPlayers=true);
        }
    });
});


// Prepare everything for the next game
function reset(resetPlayers=false) {
    if (resetPlayers) {
        player1.socketId = '';
        player2.socketId = '';
    }
    position.x = 200;
    position.y = 200;
    turn = true;
}


// I realize they are simple commands, but I found myself not being able to quickly
//      tell what was going on with these emissions. So I wrote obvious wrappers for
//      all of the ones I use
function toSender(method, data) {
    socketReference.emit(method, data)
}

function toEveryone(method, data) {
    io.emit(method, data);
}

function toAllButSender(method, data) {
    socketReference.broadcast.emit(method, data)
}


// Key difference between socket.emit() and io.emit():
//      - socket.emit()     = Only one socket will receive the message
//      - io.emit()   = ALL connected sockets will receive the message

// socket.broadcast.emit()  = Goes to everyone but the sender