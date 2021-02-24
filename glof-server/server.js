// As obviously told by the name of the file, this is the server

const Express = require('express')();
const Http = require('http').Server(Express);
const io = require('socket.io')(Http);

Http.listen(709, () => {
    console.log('Listening at :709...');
});

// The available deck of cards plus both Jokers (Z1 and Z2)
cards = [   'DA', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'DJ', 'DQ', 'DK',
    'SA', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'SJ', 'SQ', 'SK',
    'HA', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'HJ', 'HQ', 'HK',
    'CA', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'CJ', 'CQ', 'CK',
    'Z1', 'Z2'
];

var draw_pile = [];
var discard_pile = '';
var top_of_draw_pile = '';

var player1 = {socketId: '', score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
var player2 = {socketId: '', score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
var players = 0;
var player_array = [];

// To make this easy, this will be in reference to player1
// i.e.  'true' if it is player 1's turn, 'false' if not
var turn = true;

var player1Start = true;

// Probably an architectural nightmare, but basically this gets changed all the time
//      to whatever the current socket is. That way, I don't have to pass it to
//      my socket wrapper methods
socketReference = {};

io.on('connection', (socket) => {
    // TODO: Yeet this
    // socket.on('getInfo', function() {
    //     console.log(socket.id);
    //     console.log(players);
    //     console.log(player_array);
    //     console.log(io.sockets.adapter.rooms);
    // });
    console.log(`here we goooooooooooooo: ${socket.id}`);

    socket.on('joinRoom', (data) => {
        var room = data.room;
        console.log('in server');
        console.log(room);
        console.log(typeof(room));

        if (typeof(room) === 'string') {
            console.log('in here for some reason?');
            room = parseInt(room)
        }

        // TODO: Setup logic to only allow 2 people in a room
        socket.join(room);

        // Only the first player needs to setup the room
        if (io.sockets.adapter.rooms[room].player1 == undefined) {
            setUpRoom(room);
        }

        io.sockets.adapter.rooms[data.room].socketReference = socket;

        console.log('heller');
        console.log(socket.id);
        console.log(io.sockets.adapter.rooms[room].player1.socketId === '');
        console.log(room);


        // Assign players as they connect
        if (io.sockets.adapter.rooms[room].player1.socketId === '') {
            io.sockets.adapter.rooms[room].player1.socketId = socket.id;
            io.sockets.adapter.rooms[room].player1.room = room;
            io.sockets.adapter.rooms[room].player_array.push(io.sockets.adapter.rooms[room].player1);
            console.log(`player 1 id: ${socket.id}`);
            // TODO: Delete this
            // toSender('connection', {message: 'Welcome to Glof! You are Player 1', player_id: '1'});
            toSpecificSocket({id: socket.id, method: 'clientConnection', message: {message: 'Welcome to Glof! You are Player 1', player_id: '1'}});
        } else {
            io.sockets.adapter.rooms[room].player2.socketId = socket.id;
            io.sockets.adapter.rooms[room].player2.room = room;
            io.sockets.adapter.rooms[room].player_array.push(io.sockets.adapter.rooms[room].player2);
            console.log(`player 2 id: ${socket.id}`);
            console.log(`io: ${io}`);
            // console.log(`socket thing ${io.rooms[socket.id]}`);
            // TODO: Delete this
            // toSender('connection', {message: 'Welcome to Glof! You are Player 2', player_id: '2'})
            toSpecificSocket({id: socket.id, method: 'clientConnection', message: {message: 'Welcome to Glof! You are Player 2', player_id: '2'}});
        }
        io.sockets.adapter.rooms[room].players++;

        console.log('heller2');
        console.log(io.sockets.adapter.rooms[room]);
        console.log(io.sockets.adapter.rooms); // { '29834': Room....
        console.log(io.sockets.adapter.rooms[room].player1.socketId === '');
        console.log(room);
    })

    // TODO: START HERE
    // This triggers whenever a player hits the ready up button.
    socket.on('playerReadyUp', (data) => {
        io.sockets.adapter.rooms[data.room].socketReference = socket;
        room = io.sockets.adapter.rooms[data.room]
        room.player_array.find(player => player.socketId === socket.id).isReady = true;

        // When both players are ready, start the main game and send the discard card
        if (room.player1.isReady && room.player2.isReady) {
            shuffleDeckAndAssign(room);
            // Assign players their cards
            room.discard_pile = room.draw_pile.shift();
            toEveryone(room, 'updateDrawPileCount', room.draw_pile.length)
            toEveryone(room, 'startGame', room.discard_pile);
        }
    })
    // TODO: MAKE SURE THE ABOVE WORKS

    // This is the beginning of the game where each player chooses two cards they want
    //      to reveal
    socket.on('chooseCard', index => {
        io.sockets.adapter.rooms[data.room].socketReference = socket;
        current_player = player_array.find(player => player.socketId === socket.id);

        if (current_player.chosenCards < 2) {
            // Increment the number of cards they've chosen
            current_player.chosenCards++;

            // Fill their display deck with the card they chose
            current_player.display_cards[index] = current_player.cards[index];
            
            // TODO: Delete this
            // toSender('receiveCard', {card: current_player.display_cards[index], index: index});
            // Send them their choice so they can see it
            toSpecificSocket({id: current_player.socketId, method: 'receiveCard', message: {card: current_player.display_cards[index], index: index}});
        }

        // Once both players have chosen their cards, send each player the opposing player's display deck
        //      and begin the game
        if (player1.chosenCards === 2 && player2.chosenCards === 2) {
            // console.log('sent cards');
            // Send each player the other person's cards
            toSpecificSocket({id: player1.socketId, method: 'receiveOtherCards', message: player2.display_cards});
            toSpecificSocket({id: player2.socketId, method: 'receiveOtherCards', message: player1.display_cards});

            // End the choose-2 phase and begin the main game
            toEveryone('startTurns', true);
            if (turn) {
                toSpecificSocket({id: player1.socketId, method: 'notifyTurn', message: 'Your turn!'});
            } else {
                toSpecificSocket({id: player2.socketId, method: 'notifyTurn', message: 'Your turn!'});
            }
        }
    })

    // This is where the logic for turn-taking happens
    socket.on('playerTurn', data => {
        io.sockets.adapter.rooms[data.room].socketReference = socket;
        // Only allow players to do things on their turn
        if (turn && socket.id === player1.socketId || !turn && socket.id === player2.socketId) {
            current_player = player_array.find(player => player.socketId === socket.id);
            // If their action was to draw a card from the draw pile
            if (data.action === 'drawFromDrawPile') {
                // console.log('card drawn');
                // Take a card off the top of the draw pile and send it to the player
                top_of_draw_pile = draw_pile.shift()
                // TODO: Delete this
                // toSender('receiveDrawCard', top_of_draw_pile);
                toSpecificSocket({id: current_player.socketId, method: 'receiveDrawCard', message: top_of_draw_pile});
                // Update the number of cards in the draw pile so everyone can see it
                toEveryone('updateDrawPileCount', draw_pile.length);
            }
            // Or if their action was to replace a card in their grid
            else if (data.action === 'replace') {
                // console.log('card replaced');

                // Did the new card come from the discard pile or the top of the draw pile?
                new_card = data.fromDiscardOrNah ? discard_pile : top_of_draw_pile;

                // Change the discard pile to be the player's old card
                discard_pile = current_player.cards[data.data]

                // Change their card deck and their display deck to have the new card
                current_player.display_cards[data.data] = new_card;
                current_player.cards[data.data] = new_card;

                // console.log(`discard pile: ${discard_pile}`);
                // console.log(`display cards: ${current_player.display_cards}`);
                // console.log(`cards: ${current_player.cards}`);

                // Send everyone their deck and their opponent's deck
                updateAllCards();
                // Update the discard card
                toEveryone('receiveDiscardCard', discard_pile);

                // Change turns
                changeTurn(current_player);

            }
            // Or if their action was to discard a card
            // I know, I know "mAsOn ThErE aRe OnLy ThReE oPtIoNs. JuSt UsE aN eLsE", I get it
            //      Really the only reason I did this was for clarity; you're welcome
            else if (data.action === 'discard') {
                // console.log('card discarded');
                discard_pile = top_of_draw_pile;
                toEveryone('receiveDiscardCard', discard_pile);

                changeTurn(current_player);
            }
        }
    });

    // Trigger the next round
    socket.on('nextRound', function() {
        io.sockets.adapter.rooms[data.room].socketReference = socket;
        // Only player 1 is allowed to do this
        if (socket.id === player1.socketId) {
            reset();
            toEveryone('nextRoundStart');
        }
    })

    // Trigger a new game
    socket.on('newGame', function() {
        io.sockets.adapter.rooms[data.room].socketReference = socket;
        // Only player 1 is allowed to do this
        if (socket.id === player1.socketId) {
            reset('score');
            toEveryone('nextGameStart');
        }
    })

    // If people leave, let's clean up the game and get it ready for when they want to play again
    socket.on('disconnect', function() {
        io.sockets.adapter.rooms[data.room].socketReference = socket;
        // Decrement the number of players as they leave
        --players;
        // If there are no more players, reset everything for when they join next time
        if (players === 0) {
            reset('scoreAndId');
            players = 0;
            player_array = [];
        }
    });
});


// Change turns and update stuff
function changeTurn(current_player) {
    // If it's the last turn
    if (current_player.isLastTurn) {
        // console.log('last turn?');
        endGame();
    } 
    // Otherwise, change turns
    else {
        // If there are no more face-down cards, get ready to warn the remaining players that it is their last turn
        if (!current_player.display_cards.includes('')) {
            player1.isLastTurn = true;
            player2.isLastTurn = true;
        }

        // After player 1 is finished, warn player 2 or make it their turn
        if (turn && socketReference.id === player1.socketId) {
            turn = false;
            if (current_player.isLastTurn) {
                toSpecificSocket({id: player2.socketId, method: 'notifyLastTurn', message: 'Last turn!'});
            } else {
                toSpecificSocket({id: player2.socketId, method: 'notifyTurn', message: 'Your turn!'});
            }
        } 
        // Otherwise after player 2 is finished, warn player 1 or make it their turn
        else if (!turn && socketReference.id === player2.socketId) {
            turn = true;
            if (current_player.isLastTurn) {
                toSpecificSocket({id: player1.socketId, method: 'notifyLastTurn', message: 'Last turn!'});
            } else {
                toSpecificSocket({id: player1.socketId, method: 'notifyTurn', message: 'Your turn!'});
            }
        }
    }
}

// Update all hands and display cards
function updateAllCards() {
    toSpecificSocket({id: player1.socketId, method: 'receiveOtherCards', message: player2.display_cards});
    toSpecificSocket({id: player2.socketId, method: 'receiveOtherCards', message: player1.display_cards});

    toSpecificSocket({id: player1.socketId, method: 'updateCards', message: player1.display_cards});
    toSpecificSocket({id: player2.socketId, method: 'updateCards', message: player2.display_cards});
}

// Prepare everything for the next game
function reset(resetPlayers) {
    var doSetup = true;
    if (resetPlayers === 'scoreAndId') {
        player1 = {socketId: '', score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
        player2 = {socketId: '', score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
        doSetup = false;
        player1Start = true;
        turn = true;
    } else if (resetPlayers === 'score') {
        player1 = {socketId: player1.socketId, score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
        player2 = {socketId: player2.socketId, score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
    } else {
        player1 = {socketId: player1.socketId, score: player1.score, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
        player2 = {socketId: player2.socketId, score: player2.score, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
    }
    // console.log('player 1');
    // console.log(player1);
    // console.log('player 2');
    // console.log(player2);
    draw_pile = [];
    discard_pile = '';
    top_of_draw_pile = '';
    player_array = [player1, player2];

    turn = player1Start ? false : true;
    player1Start = player1Start ? false : true;

    if (doSetup) {
        shuffleDeckAndAssign();
        updateAllCards();
        discard_pile = draw_pile.shift();
        toEveryone('receiveDiscardCard', discard_pile);
        toEveryone('updateDrawPileCount', draw_pile.length);
    }
}

// Calculate scores, notify players, and reset
function endGame() {
    setScores();

    toSpecificSocket({id: player1.socketId, method: 'revealCards', message: {yours: player1.cards, theirs: player2.cards}});
    toSpecificSocket({id: player2.socketId, method: 'revealCards', message: {yours: player2.cards, theirs: player1.cards}});

    if ((player1.score < player2.score && player1.score <= -100) || (player1.score < player2.score && player2.score >= 100)) {
        toEveryone('announceWinner', {message: 'Player 1 Wins!', p1Score: player1.score, p2Score: player2.score})
    } else if ((player2.score < player1.score && player2.score <= -100) || (player2.score < player1.score && player1.score >= 100)) {
        toEveryone('announceWinner', {message: 'Player 2 Wins!', p1Score: player1.score, p2Score: player2.score})
    } else {
        toEveryone('roundSummary', {message: 'Round Summary', p1Score: player1.score, p2Score: player2.score});
    }
}





// I realize they are simple commands, but I found myself not being able to quickly
//      tell what was going on with these emissions. So I wrote obvious wrappers for
//      all of the ones I use

// TODO: Delete this
// function toSender(data) {
//     socketReference.emit(method, data);
// }

function toEveryone(room, method, data) {
    // io.emit(method, data);
    io.sockets.in(room).emit(method, data);
}

function toSpecificSocket(data) {
    io.to(data.id).emit(data.method, data.message);
}

// I don't use this, but I'm gonna leave it in here for later just so I have it
// function toAllButSender(method, data) {
//     socketReference.broadcast.emit(method, data);
// }



function setUpRoom(roomId) {
    // The available deck of cards plus both Jokers (Z1 and Z2)
    io.sockets.adapter.rooms[roomId].cards = ['DA', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'DJ', 'DQ', 'DK',
    'SA', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'SJ', 'SQ', 'SK',
    'HA', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'HJ', 'HQ', 'HK',
    'CA', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'CJ', 'CQ', 'CK',
    'Z1', 'Z2'
    ];

    io.sockets.adapter.rooms[roomId].draw_pile = [];
    io.sockets.adapter.rooms[roomId].discard_pile = '';
    io.sockets.adapter.rooms[roomId].top_of_draw_pile = '';

    io.sockets.adapter.rooms[roomId].player1 = {socketId: '', room: 0, score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
    io.sockets.adapter.rooms[roomId].player2 = {socketId: '', room: 0, score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
    io.sockets.adapter.rooms[roomId].players = 0;
    io.sockets.adapter.rooms[roomId].player_array = [];

    // To make this easy, this will be in reference to player1
    // i.e.  'true' if it is player 1's turn, 'false' if not
    io.sockets.adapter.rooms[roomId].turn = true;

    io.sockets.adapter.rooms[roomId].player1Start = true;

    // Probably an architectural nightmare, but basically this gets changed all the time
    //      to whatever the current socket is. That way, I don't have to pass it to
    //      my socket wrapper methods
    io.sockets.adapter.rooms[roomId].socketReference = {};
    }

// Shuffle the deck and give everyone their 6 cards from the top of the draw_pile
function shuffleDeckAndAssign(room) {
    room.draw_pile = [...room.cards];
    for(let i = room.draw_pile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i)
        const temp = room.draw_pile[i]
        room.draw_pile[i] = room.draw_pile[j]
        room.draw_pile[j] = temp
    }

    // console.log('cards');
    // console.log(cards);
    // console.log('\n\n\n\n');
    // console.log('draw');
    // console.log(draw_pile);

    for(let i = 0; i < 6; i++) {
        player1.cards[i] = draw_pile.shift();
        player2.cards[i] = draw_pile.shift();
    }

    // console.log('\n\n\n\n');
    // console.log('player 1 cards');
    // console.log(player1.cards);
    // console.log('\n\n\n\n');
    // console.log('player 2 cards');
    // console.log(player2.cards);
}

// Used for scoring
// Convert the card letters to number values I can use (if you're wondering why I didn't just
//      use numbers to start with, it's because Jack, Queen, and 10 all have the same value)
function getCardValuesList(card_list) {
    card_scores = [];
    card_list.forEach(card => {
        if (card.includes('Z')) {
            card_scores.push(-25);
        } else if (card.includes('A')) {
            card_scores.push(1);
        } else if (card.includes('10')) {
            card_scores.push(10);
        } else if (card.includes('K')) {
            card_scores.push(0);
        } else if (card.includes('J') || card.includes('Q')) {
            card_scores.push(card[1]);
        } else {
            card_scores.push(parseInt(card[1], 10));
        }
    });
    return card_scores;
}

// Calculate the score for this round and add it to each player's total score
function setScores() {
    player1.score += calculateScore(getCardValuesList(player1.cards));
    player2.score += calculateScore(getCardValuesList(player2.cards));
    // console.log(player1.score);
    // console.log(player2.score);
}

// Actually do the score calculations
// This figures out each column, determines if blocks exist, etc
function calculateScore(card_scores) {
    blockPosition = 1;
    player_total_score = 0;
    
    columns = [
        [card_scores[0], card_scores[3]],
        [card_scores[1], card_scores[4]],
        [card_scores[2], card_scores[5]]
    ];

    // Check for blocks (2x2 of the same card)
    if (columns[0][0] === columns[0][1] && columns[1][0] === columns[1][1] && 
        columns[0][0] === columns[1][0] && columns[0][1] === columns[1][1]) {
        blockPosition = 2;
        player_total_score -= 25;
    } else if (columns[1][0] === columns[1][1] && columns[2][0] === columns[2][1] &&
                columns[1][0] === columns[2][0] && columns[1][1] === columns[2][1]) {
        blockPosition = 0;
        player_total_score -= 25;
    }

    // If there is a block, then score just the last remaining column
    if (blockPosition != 1) {
        if (columns[blockPosition][0] === -25 && columns[blockPosition][1] === -25) {
            player_total_score -= 50;
        } else if (columns[blockPosition].includes(2) && columns[blockPosition].includes(-25)) {
            player_total_score -= 25;
        } else if (columns[blockPosition].includes(2) || (columns[blockPosition][0] === columns[blockPosition][1])) {
            player_total_score += 0;
        } else if (columns[blockPosition].includes('J') && columns[blockPosition].includes('Q')) {
            player_total_score += 20;
        } else if (columns[blockPosition].includes('J') || columns[blockPosition].includes('Q')) {
            columns[blockPosition].forEach(item => {
                if (item != 'J' && item != 'Q') {
                    player_total_score += (10 + item);
                }
            });
        } else {
            player_total_score += (columns[blockPosition][0] + columns[blockPosition][1]);
        }
    } 
    // Otherwise, since there are no blocks, calculate each column individually and add them together
    else {
        columns.forEach(item => {
            if (item.includes(-25)) {
                count = 0;
                item.forEach(elem => {
                    if (elem === -25) {
                        count += 1;
                    }
                });
                if (count === 2) {
                    player_total_score -= 50;
                }
            }
            if (item.includes(2) && item.includes(-25)) {
                player_total_score -= 25;
            } else if (item.includes(2) || (item[0] === item[1])) {
                player_total_score += 0;
            } else if (item.includes('J') && item.includes('Q')) {
                player_total_score += 20;
            } else if (item.includes('J') || item.includes('Q')) {
                item.forEach(elem => {
                    if (elem != 'J' && elem != 'Q') {
                        player_total_score += (10 + elem);
                    }
                });
            } else {
                player_total_score += (item[0] + item[1]);
            }
        });
    }

    return player_total_score;
}


// Mason Stooksbury (2020) - rooms added in 2021
// <>< #!
