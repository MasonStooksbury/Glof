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

var player1 = '';
var player2 = '';
var players = 0;

// To make this easy, this will be in reference to player1
// i.e.  'true' if it is player 1's turn, 'false' if not
var turn = true;

io.on('connection', (socket) => {
    socket.emit('position', position);
    if (player1 === '') {
        player1 = socket.id;
        console.log(`player 1 id: ${socket.id}`);
        socket.emit('greet', {message: 'Welcome to Flog! You are Player 1', player_id: '1'})
    } else {
        player2 = socket.id;
        console.log(`player 2 id: ${socket.id}`);
        socket.emit('greet', {message: 'Welcome to Flog! You are Player 2', player_id: '2'})
    }
    ++players;

    socket.on('startGame', function() {
        // If everyone is here and Player 1 initiated the start, then start
        if (players === 2 && socket.id === player1) {
            io.emit('startGame', true);
        }
    })

    socket.on('move', data => {
        // Only allow players to do things on their turn
        if (turn && socket.id === player1 || !turn && socket.id === player2) {
            switch(data) {
                case 'left':
                    position.x -= 10;
                    io.emit('position', position);
                    break;
                case 'right':
                    position.x += 10;
                    io.emit('position', position);
                    break;
                case 'up':
                    position.y -= 10;
                    io.emit('position', position);
                    break;
                // When they player is done with their turn, flip the turn boolean
                case 'down':
                    if (turn && socket.id === player1) {
                        turn = false;
                    } else if (!turn && socket.id === player2) {
                        turn = true;
                    }
                    break;
            }
            console.log(position.x);
            console.log(position.y);
            // Win-condition
            if (position.x === 150 && position.y === 150) {
                winningPlayer = socket.id === player1 ? '1' : '2';

                socket.emit('winStatus', {message: 'You won! :D', winningPlayer: winningPlayer})
                socket.broadcast.emit('winStatus', {message: 'You lost :(', winningPlayer: winningPlayer})
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
        player1 = '';
        player2 = '';
    }
    position.x = 200;
    position.y = 200;
    turn = true;
}


// Key difference between socket.emit() and io.emit():
//      - socket.emit()     = Only one socket will receive the message
//      - io.emit()   = ALL connected sockets will receive the message

// socket.broadcast.emit()  = Goes to everyone but the sender