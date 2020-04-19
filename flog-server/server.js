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

// var player1_cards = ['HK', 'H3', 'HA', 'H2', 'H5', 'J'];
// var player2_cards = ['SK', 'S6', 'S8', 'S10', 'SJ', 'SA'];

var draw_pile = ['SA', 'HK', 'J2'];
var discard_pile = '';
var top_of_draw_pile = '';

var player1 = {socketId: '', isReady: false, chosenCards: 0, display_cards: ['', '', '', '', '', ''], cards: ['H9', 'H3', 'HA', 'H2', 'H5', 'J1']};
var player2 = {socketId: '', isReady: false, chosenCards: 0, display_cards: ['', '', '', '', '', ''], cards: ['SK', 'S6', 'S8', 'S10', 'SJ', 'SA']};
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
        socketReference = socket;
        player_array.find(player => player.socketId === socket.id).isReady = true;

        // When both players are ready, start the main game and send the discard card
        if (player1.isReady && player2.isReady) {
            discard_pile = draw_pile.shift();
            toEveryone('startGame', discard_pile);
        }
    })

    // This is the beginning of the game where each player chooses two cards they want
    //      to reveal
    socket.on('chooseCard', index => {
        socketReference = socket;
        current_player = player_array.find(player => player.socketId === socket.id);

        if (current_player.chosenCards < 2) {
            // Increment the number of cards they've chosen
            current_player.chosenCards++;

            // Fill their display deck with the card they chose
            current_player.display_cards[index] = current_player.cards[index];

            // Send them their choice so they can see it
            toSender('receiveCard', {card: current_player.display_cards[index], index: index});
        }

        if (player1.chosenCards === 2 && player2.chosenCards === 2) {
            // Send each player the other person's cards
            toSpecificSocket({id: player1.socketId, method: 'receiveOtherCards', message: player2.display_cards});
            toSpecificSocket({id: player2.socketId, method: 'receiveOtherCards', message: player1.display_cards});

            // End the choose-2 phase and begin the main game
            toEveryone('startTurns', true);
        }
    })

    // TODO: Take turns until end

    // This is where the logic for turn-taking happens
    socket.on('playerTurn', data => {
        socketReference = socket;
        // Only allow players to do things on their turn
        if (turn && socket.id === player1.socketId || !turn && socket.id === player2.socketId) {
            if (data.action === 'drawFromDrawPile') {
                console.log('card drawn');
                top_of_draw_pile = draw_pile.shift()
                toSender('receiveDrawCard', top_of_draw_pile);
            } else if (data.action === 'replace') {
                console.log('card replaced');
                current_player = player_array.find(player => player.socketId === socket.id);

                discard_pile = current_player.cards[data.data]
                current_player.display_cards[data.data] = top_of_draw_pile;
                current_player.cards[data.data] = top_of_draw_pile;

                console.log(`discard pile: ${discard_pile}`);
                console.log(`display cards: ${current_player.display_cards}`);
                console.log(`cards: ${current_player.cards}`);

                updateAllCards();
                toEveryone('receiveDiscardCard', discard_pile);

                if (turn && socket.id === player1.socketId) {
                    turn = false;
                } else if (!turn && socket.id === player2.socketId) {
                    turn = true;
                }
            } else if (data.action === 'discard') {
                console.log('card discarded');
                discard_pile = top_of_draw_pile;
                toEveryone('receiveDiscardCard', discard_pile);
            }
            
            
            
            // When the player is done with their turn, flip the turn boolean
            // if (data === 'down'){
            //     if (turn && socket.id === player1.socketId) {
            //         turn = false;
            //     } else if (!turn && socket.id === player2.socketId) {
            //         turn = true;
            //     }
            // }

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
        socketReference = socket;
        // Decrement the number of players as they leave
        --players;
        // If there are no more players, reset everything for when they join next time
        if (players === 0) {
            reset(resetPlayers=true);
        }
    });
});


// Update all hands and display cards
function updateAllCards() {
    toSpecificSocket({id: player1.socketId, method: 'receiveOtherCards', message: player2.display_cards});
    toSpecificSocket({id: player2.socketId, method: 'receiveOtherCards', message: player1.display_cards});

    toSpecificSocket({id: player1.socketId, method: 'updateCards', message: player1.display_cards});
    toSpecificSocket({id: player2.socketId, method: 'updateCards', message: player2.display_cards});
}


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
    io.to(data.id).emit(data.method, data.message);
}


// Key difference between socket.emit() and io.emit():
//      - socket.emit()     = Only one socket will receive the message
//      - io.emit()   = ALL connected sockets will receive the message

// socket.broadcast.emit()  = Goes to everyone but the sender