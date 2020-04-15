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

var player1 = {socketId: '', isReady: false, chosenCards: 0, cards: ['HK', 'H3', 'HA', 'H2', 'H5', 'J']};
var player2 = {socketId: '', isReady: false, chosenCards: 0, cards: ['SK', 'S6', 'S8', 'S10', 'SJ', 'SA']};
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

    // TODO: Initialize game setup (shuffle and deal)

    // Assign players as they connect
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
    socket.on('playerReadyUp', function() {
        player_array.find(player => player.socketId === socket.id).isReady = true;

        if (player1.isReady && player2.isReady) {
            toEveryone('startGame', true);
        }
    })

    // TODO: Choose two cards
    socket.on('chooseCard', index => {
        players_cards = player_array.find(player => player.socketId === socket.id).chosenCards;
        if (players_cards < 2) {
            players_cards++;
            console.log(`cards chosen: ${players_cards}`);
            console.log(`socket: ${socket.id}`);
            // TODO: Give player their card and other card to display
            // Sent to wrong sender?
            toSender('receiveCard', player_array.find(player => player.socketId === socket.id).cards[index]);
        }

        if (player1.chosenCards === 2 && player2.chosenCards === 2) {
            // Send each player the other persons cards
            toSpecificSocket({id: player1.socketId, method: 'receiveOtherCard', message: player2.cards});
            toSpecificSocket({id: player2.socketId, method: 'receiveOtherCard', message: player1.cards});
            // ^^^ TODO: Don't send the whole card array... Or maybe do, and fix it client side?
            toEveryone('startTurns', true);
        }
    })

    // TODO: Take turns until end

    // This is where the logic for turn-taking happens
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

    // TODO: Trigger last turns
    // TODO: Calculate scores
    // TODO: Reset game (shuffle, deal, trigger start)

    
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
    socketReference.broadcast.emit(method, data);
}

function toSpecificSocket(data) {
    socket.broadcast.to(data.id).emit(data.method, data.message);
}


// Key difference between socket.emit() and io.emit():
//      - socket.emit()     = Only one socket will receive the message
//      - io.emit()   = ALL connected sockets will receive the message

// socket.broadcast.emit()  = Goes to everyone but the sender