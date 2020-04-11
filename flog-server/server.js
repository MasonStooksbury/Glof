const Express = require('express')();
const Http = require('http').Server(Express);
const Socketio = require('socket.io')(Http);

Http.listen(709, () => {
    console.log('Listening at :709...');
});

var position = {
    x: 200,
    y: 200
};

var player1 = '';
var player2 = '';

// To make this easy, this will be in reference to player1
// i.e.  'true' if it is player 1's turn, 'false' if not
var turn = true;

Socketio.on('connection', (socket) => {
    socket.emit('position', position);
    socket.emit('greet', `Welcome to Flog, ${socket.id}!`)
    if (player1 === '') {
        player1 = socket.id;
        console.log(`player 1 id: ${socket.id}`);
    } else {
        player2 = socket.id;
        console.log(`player 2 id: ${socket.id}`);
    }


    socket.on('move', data => {
        if (turn && socket.id === player1 || !turn && socket.id === player2) {
            switch(data) {
                case 'left':
                    position.x -= 10;
                    Socketio.emit('position', position);
                    break;
                case 'right':
                    position.x += 10;
                    Socketio.emit('position', position);
                    break;
                case 'up':
                    position.y -= 10;
                    Socketio.emit('position', position);
                    break;
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
            if (position.x === 150 && position.y === 150) {
                console.log('in here????????');
                socket.to(socket.id).emit('winStatus', 'You won! :D')
                socket.broadcast.emit('winStatus', 'You lost :(')
			}
        }
    });

    
    socket.on('disconnect', function() {
        // If player1 leaves, promote player2 and free up his spot
        if (socket.id === player1) {
            player1 = player2;
            console.log('Player2 was promoted to Player1!');
            socket.broadcast.emit('greet', `Player2 was promoted to Player1!`)
        }
        // Otherwise, just free up player2's spot
        player2 = '';

        // socket.emit('greet', `Welcome to Flog, ${socket.id}!`)
    });
});


// Key difference between socket.emit() and Socketio.emit():
//      - socket.emit()     = Only one socket will receive the message
//      - Socketio.emit()   = ALL connected sockets will receive the message

// socket.broadcast.emit()  = Goes to everyone but the sender