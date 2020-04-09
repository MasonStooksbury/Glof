const Express = require("express")();
const Http = require("http").Server(Express);
const Socketio = require("socket.io")(Http);

Http.listen(709, () => {
    console.log("Listening at :709...");
});

var position = {
    x: 200,
    y: 200
};

var player1 = '';
var player2 = '';

// To make this easy, this will be in reference to player1
// i.e.  "true" if it is player 1's turn, "false" if not
var turn = true;

Socketio.on("connection", (socket) => {
    socket.emit("position", position);
    socket.emit("greet", `Welcome to Flog, ${socket.id}!`)
    if (player1 === '') {
        player1 = socket.id;
        console.log(`player 1 id: ${socket.id}`);
    } else {
        player2 = socket.id;
        console.log(`player 2 id: ${socket.id}`);
    }


    socket.on("move", data => {
        console.log('in move');
        console.log(`turn: ${turn}`);
        console.log(`other thing: ${socket.id === player1}`);
        console.log(`player id: ${socket.id}`);
        if (turn && socket.id === player1) {
            console.log('player1 turn');
            // Once player has discarded or replaced, they are done
            turn = false;
        } else if (!turn && socket.id === player2) {
            console.log('player2 turn');
            turn = true;
        }

        console.log(data);
        switch(data) {
            case "left":
                position.x -= 10;
                Socketio.emit("position", position);
                break;
            case "right":
                position.x += 10;
                Socketio.emit("position", position);
                break;
            case "up":
                position.y -= 10;
                Socketio.emit("position", position);
                break;
            case "down":
                position.y += 10;
                Socketio.emit("position", position);
                break;
        }
    });

    
    Socketio.on("disconnect", (socket) => {
        // If player1 leaves, promote player2 and free up his spot
        if (socket.id === player1) {
            player1 = player2;
        }
        // Otherwise, just free up player2's spot
        player2 = '';
        socket.emit('Player2 was promoted to Player1!');
        socket.emit("greet", `Welcome to Flog, ${socket.id}!`)
    });
});


// Key difference between socket.emit() and Socketio.emit():
//      - socket.emit()     = Only one socket will receive the message
//      - Socketio.emit()   = ALL connected sockets will receive the message

// socket.broadcast.emit()  = Goes to everyone but the sender