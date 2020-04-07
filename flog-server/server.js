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

Socketio.of('/flog').on("connection", (socket) => {
    socket.emit("position", position);
    socket.emit("greet", 'Welcome to the Flog!')

    socket.on("move", data => {
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
});

// Key difference between socket.emit() and Socketio.emit():
//      - socket.emit()     = Only one socket will receive the message
//      - Socketio.emit()   = ALL connected sockets will receive the message

// socket.broadcast.emit()  = Goes to everyone but the sender