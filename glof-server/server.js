const Express = require('express')();
const Http = require('http').Server(Express);
const io = require('socket.io')(Http);

Http.listen(709, () => {
    console.log('Listening at :709...');
});

// var player1_cards = ['HK', 'H3', 'HA', 'H2', 'H5', 'J'];
// var player2_cards = ['SK', 'S6', 'S8', 'S10', 'SJ', 'SA'];
cards = [   'DA', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'DJ', 'DQ', 'DK',
    'SA', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'SJ', 'SQ', 'SK',
    'HA', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'HJ', 'HQ', 'HK',
    'CA', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'CJ', 'CQ', 'CK',
    'Z1', 'Z2'
];

var draw_pile = [];
var discard_pile = '';
var top_of_draw_pile = '';

var player1 = {socketId: '', isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
var player2 = {socketId: '', isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['', '', '', '', '', '']};
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

    // Assign players as they connect
    if (player1.socketId === '') {
        player1.socketId = socket.id;
        player_array.push(player1);
        console.log(`player 1 id: ${socket.id}`);
        toSender('connection', {message: 'Welcome to Glof! You are Player 1', player_id: '1'});
    } else {
        player2.socketId = socket.id;
        player_array.push(player2);
        console.log(`player 2 id: ${socket.id}`);
        toSender('connection', {message: 'Welcome to Glof! You are Player 2', player_id: '2'})
    }
    ++players;

    // This triggers whenever a player hits the ready up button.
    socket.on('playerReadyUp', function() {
        socketReference = socket;
        player_array.find(player => player.socketId === socket.id).isReady = true;

        // When both players are ready, start the main game and send the discard card
        if (player1.isReady && player2.isReady) {
            shuffleDeckAndAssign();
            // Assign players their cards
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
            console.log('sent cards');
            // Send each player the other person's cards
            toSpecificSocket({id: player1.socketId, method: 'receiveOtherCards', message: player2.display_cards});
            toSpecificSocket({id: player2.socketId, method: 'receiveOtherCards', message: player1.display_cards});

            // End the choose-2 phase and begin the main game
            toEveryone('startTurns', true);
        }
    })

    // This is where the logic for turn-taking happens
    socket.on('playerTurn', data => {
        socketReference = socket;
        // Only allow players to do things on their turn
        if (turn && socket.id === player1.socketId || !turn && socket.id === player2.socketId) {
            current_player = player_array.find(player => player.socketId === socket.id);
            if (data.action === 'drawFromDrawPile') {
                console.log('card drawn');
                top_of_draw_pile = draw_pile.shift()
                toSender('receiveDrawCard', top_of_draw_pile);
            } else if (data.action === 'replace') {
                console.log('card replaced');

                // Determine what the card that will be kept based on where it was drawn
                new_card = data.fromDiscardOrNah ? discard_pile : top_of_draw_pile;

                // Change the discard pile to be the player's old card
                discard_pile = current_player.cards[data.data]

                // Change their card deck and their display deck to have the new card
                current_player.display_cards[data.data] = new_card;
                current_player.cards[data.data] = new_card;

                console.log(`discard pile: ${discard_pile}`);
                console.log(`display cards: ${current_player.display_cards}`);
                console.log(`cards: ${current_player.cards}`);

                // Send everyone their deck and their opponent's deck
                updateAllCards();
                // Update the discard card
                toEveryone('receiveDiscardCard', discard_pile);

                // Change turns
                changeTurn(current_player);

                // if (current_player.isLastTurn) {
                //     endGame();
                // } else {
                //     if (!current_player.display_cards.includes('')) {
                //         player1.isLastTurn = true;
                //         player2.isLastTurn = true;
                //     }

                //     if (turn && socket.id === player1.socketId) {
                //         turn = false;
                //         if (current_player.isLastTurn) {
                //             toSpecificSocket({id: player2.socketId, method: 'notifyLastTurn'});
                //         } else {
                //             toSpecificSocket({id: player2.socketId, method: 'notifyTurn', message: 'Your turn!'});
                //         }
                //     } else if (!turn && socket.id === player2.socketId) {
                //         turn = true;
                //         if (current_player.isLastTurn) {
                //             toSpecificSocket({id: player1.socketId, method: 'notifyLastTurn'});
                //         } else {
                //             toSpecificSocket({id: player1.socketId, method: 'notifyTurn', message: 'Your turn!'});
                //         }
                //     }
                // }

            } else if (data.action === 'discard') {
                console.log('card discarded');
                discard_pile = top_of_draw_pile;
                toEveryone('receiveDiscardCard', discard_pile);

                changeTurn(current_player);
            }
            
            
            
            // When the player is done with their turn, flip the turn boolean
            // if (data === 'down'){
            //     if (turn && socket.id === player1.socketId) {
            //         turn = false;
            //     } else if (!turn && socket.id === player2.socketId) {
            //         turn = true;
            //     }
            // }
            // Win-condition
            // if (position.x === 150 && position.y === 150) {
            //     winningPlayer = socket.id === player1.socketId ? '1' : '2';

            //     toSender('winStatus', {message: 'You won! :D', winningPlayer: winningPlayer});
            //     toAllButSender('winStatus', {message: 'You lost :(', winningPlayer: winningPlayer})
			// }
        }
    });

    // TODO: Reset game (shuffle, deal, trigger start)

    socket.on('nextRound', function() {
        if (socket.id === player1.socketId) {
            reset();
            updateAllCards();
            discard_pile = draw_pile.shift();
            toEveryone('receiveDiscardCard', discard_pile);
            toEveryone('nextRoundStart');
        }
    })

    socket.on('newGame', function() {
        if (socket.id === player1.socketId) {
            reset('score');
            updateAllCards();
            discard_pile = draw_pile.shift();
            toEveryone('receiveDiscardCard', discard_pile);
            toEveryone('nextGameStart');
        }
    })

    
    socket.on('disconnect', function() {
        socketReference = socket;
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
    if (current_player.isLastTurn) {
        console.log('last turn?');
        endGame();
    } else {
        if (!current_player.display_cards.includes('')) {
            player1.isLastTurn = true;
            player2.isLastTurn = true;
        }

        if (turn && socketReference.id === player1.socketId) {
            turn = false;
            if (current_player.isLastTurn) {
                toSpecificSocket({id: player2.socketId, method: 'notifyLastTurn', message: 'Last turn!'});
            } else {
                toSpecificSocket({id: player2.socketId, method: 'notifyTurn', message: 'Your turn!'});
            }
        } else if (!turn && socketReference.id === player2.socketId) {
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
    if (resetPlayers === 'scoreAndId') {
        player1 = {socketId: '', score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['H9', 'H3', 'HA', 'H2', 'H5', 'J1']};
        player2 = {socketId: '', score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['SK', 'S6', 'S8', 'S10', 'SJ', 'SA']};
    } else if (resetPlayers === 'score') {
        player1 = {socketId: player1.socketId, score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['H9', 'H3', 'HA', 'H2', 'H5', 'J1']};
        player2 = {socketId: player2.socketId, score: 0, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['SK', 'S6', 'S8', 'S10', 'SJ', 'SA']};
    } else {
        player1 = {socketId: player1.socketId, score: player1.score, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['H9', 'H3', 'HA', 'H2', 'H5', 'J1']};
        player2 = {socketId: player2.socketId, score: player2.score, isReady: false, chosenCards: 0, isLastTurn: false, display_cards: ['', '', '', '', '', ''], cards: ['SK', 'S6', 'S8', 'S10', 'SJ', 'SA']};
    }
    console.log('player 1');
    console.log(player1);
    console.log('player 2');
    console.log(player2);
    draw_pile = [];
    discard_pile = '';
    top_of_draw_pile = '';
    player_array = [player1, player2];
    turn = true;
    // TODO: Reshuffle draw pile
}

// Calculate scores, notify players, and reset
function endGame() {
    calculateScores();

    if (player1.score > player2.score && player1.score >= 100) {
        toEveryone('announceWinner', {message: 'Player 1 Wins!', p1Score: player1.score, p2Score: player2.score})
    } else if (player2.score > player1.score && player2.score >= 100) {
        toEveryone('announceWinner', {message: 'Player 2 Wins!', p1Score: player1.score, p2Score: player2.score})
    } else {
        toEveryone('roundSummary', {message: 'Round Summary', p1Score: player1.score, p2Score: player2.score});
    }
}

// TODO: Yeet?
// function sendScores() {
//     toSpecificSocket({id: player1.socketId, method: 'roundSummary', message: player1.score});
//     toSpecificSocket({id: player2.socketId, method: 'roundSummary', message: player2.score});
// }


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




function shuffleDeckAndAssign() {
    draw_pile = [...cards];
    for(let i = draw_pile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i)
        const temp = draw_pile[i]
        draw_pile[i] = draw_pile[j]
        draw_pile[j] = temp
    }

    console.log('cards');
    console.log(cards);
    console.log('\n\n\n\n');
    console.log('draw');
    console.log(draw_pile);

    for(let i = 0; i < 6; i++) {
        player1.cards[i] = draw_pile.shift();
        player2.cards[i] = draw_pile.shift();
    }

    console.log('\n\n\n\n');
    console.log('player 1 cards');
    console.log(player1.cards);
    console.log('\n\n\n\n');
    console.log('player 2 cards');
    console.log(player2.cards);
}


function getScore(card) {
    if (card.includes('Z')) {
        return -25;
    } else if (card.includes('A')) {
        return 1;
    } else if (card.includes('10')) {
        return 10;
    } else if (card.includes('K')) {
        return 0;
    } else if (card.includes('J') || card.includes('Q')) {
        return card[1];
    } else {
        return parseInt(card[1], 10);
    }
}

function calculateScores() {
    blockPosition = 1;

    player1_card_scores = [];
    player2_card_scores = [];

    player1.cards.forEach(function (item, index) {
        player1_card_scores[index] = getScore(item);
    });
    console.log(player1_card_scores);
    console.log(player1.cards);
    console.log('\n\n\n\n');

    player2.cards.forEach(function (item, index) {
        player2_card_scores[index] = getScore(item);
    });
    console.log(player2_card_scores);
    console.log(player2.cards);

    console.log('\n\n\n\n');


    // Break into columns
    columns = [
                [player1_card_scores[0], player1_card_scores[3]],
                [player1_card_scores[1], player1_card_scores[4]],
                [player1_card_scores[2], player1_card_scores[5]]
              ];
    column_scores = [];
    player1_total_score = 0;
    player2_total_score = 0;

    // Check for blocks
    if (columns[0][0] === columns[0][1] && columns[1][0] === columns[1][1]) {
        blockPosition = 2;
        player1_total_score -= 25;
    } else if (columns[1][0] === columns[1][1] && columns[2][0] === columns[2][1]) {
        blockPosition = 0;
        player1_total_score -= 25;
    }
    console.log('block?');
    console.log(blockPosition);

    // If there is a block (2x2 of the same card), then check the last remaining column
    if (blockPosition != 1) {
        console.log('block scorer');
        console.log('block position');
        console.log(blockPosition);
        console.log('columns');
        console.log(columns[blockPosition]);
        if (columns[blockPosition].includes(2) && columns[blockPosition].includes(-25)) {
            player1_total_score -= 25;
        } else if (columns[blockPosition].includes(2) || (columns[blockPosition][0] === columns[blockPosition][1])) {
            player1_total_score += 0;
        } else if (columns[blockPosition].includes('J') && columns[blockPosition].includes('Q')) {
            player1_total_score += 20;
        } else if (columns[blockPosition].includes('J') || columns[blockPosition].includes('Q')) {
            columns[blockPosition].forEach(item => {
                if (item != 'J' && item != 'Q') {
                    player1_total_score += (10 + item);
                }
            });
        } else {
            player1_total_score += (columns[blockPosition][0] + columns[blockPosition][1]);
        }
    } 
    // Otherwise, since there are no blocks, calculate each column collectively
    else {
        columns.forEach(item => {
            console.log('item');
            console.log(item);
            if (item.includes(2) && item.includes(-25)) {
                console.log('2 and joker');
                player1_total_score -= 25;
            } else if (item.includes(2) || (item[0] === item[1])) {
                console.log('just 2 or matching');
                player1_total_score += 0;
            } else if (item.includes('J') && item.includes('Q')) {
                console.log('J and Q');
                player1_total_score += 20;
            } else if (item.includes('J') || item.includes('Q')) {
                console.log('J or Q');
                item.forEach(elem => {
                    if (elem != 'J' && elem != 'Q') {
                        console.log('score before');
                        console.log(player1_total_score);
                        player1_total_score += (10 + elem);
                        console.log('score after');
                        console.log(player1_total_score);
                    }
                });
            } else {
                console.log('main else');
                console.log(item[0]);
                console.log(item[1]);
                player1_total_score += (item[0] + item[1]);
            }
        });
    }

    player1.score = player1_total_score;
    console.log('total');
    console.log(player1_total_score);
    player2.score = 30;
}


// Key difference between socket.emit() and io.emit():
//      - socket.emit()     = Only one socket will receive the message
//      - io.emit()   = ALL connected sockets will receive the message

// socket.broadcast.emit()  = Goes to everyone but the sender