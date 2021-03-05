import { Component, OnInit, AfterViewInit, AfterViewChecked } from '@angular/core';
import io from 'socket.io-client';
import "primeflex/primeflex.css";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, AfterViewChecked {	
	context: any;
	socket: any;

	startGame = false;
	mainMenu = false;
	lobby = true;

	readyButtonText = "I'm ready!";
	message = '';
	player_id = '';
	headerMessage = '';
	winningPlayer = '';
	otherText = '';
	showDialog = false;
	showTurnDialog = false;
	theirTurn = 'is-turn';
	myTurn = '';
	isSelected = '';
	topDiscardCard = '';
	topDrawCard = '';
	drawPileCount = 0;

	// Each card will start off as an empty string
	my_cards = ['', '', '', '', '', ''];
	their_cards = ['', '', '', '', '', ''];

	// Phase booleans
	chooseTwoPhase = false;
	turnsPhase = false;

	// We have both to prevent drawing from and then discarding to the discard pile
	cardDrawnFromDrawPile = false;
	cardDrawnFromDiscardPile = false;

	player1Score = 0;
	player2Score = 0;

	gameOver = false;

	roomId = 0;

	cardBackImages = [
		{label: 'StainedGlass', value: 'assets/Backs/StainedGlass.png'},
		{label: 'MS', value: 'assets/Backs/MS.png'},
		{label: 'GlofTheGame', value: 'assets/Backs/GlofTheGame.png'},
		{label: 'Psychedelic', value: 'assets/Backs/Psychedelic.png'}
	];

	cardBackImage = 'assets/Backs/GlofTheGame.png';
	lastTurnImage = 'assets/lastturn.png';

	constructor() { }

	public ngOnInit() {
		this.socket = io("stlouis5.cubehostingmc.com:24841", {transport: ['websocket', 'polling']});
		this.roomId = Math.floor(Math.random()*(99999-10000+1)+10000);
	}

	public ngAfterViewInit() {
		// Once client creates or joins a room
		this.socket.on('clientConnection', data => {
			this.mainMenu = true;
			this.lobby = false;
			this.message = data.message;
			this.player_id = data.player_id;
		})
		// Once Player 1 has started the game and the server approves
		this.socket.on('startGame', data => {
			this.initializeAllCards(this.cardBackImage);
			this.mainMenu = false;
			this.startGame = true;
			// console.log(`discard card from start game: ${data}`);
			this.topDiscardCard = data;
			this.changeCardImage('discard', `assets/Fronts/${data}.png`);
			// Once the game has started, allow the players to pick two cards
			this.chooseTwoPhase = true;
		})
		// Begin actual play after players have chosen their two cards to flip up
		this.socket.on('startTurns', data => {
			this.chooseTwoPhase = false;
			this.turnsPhase = true;
		})
		// Receive a card from the server
		this.socket.on('receiveCard', data => {
			this.my_cards[data.index] = data.card;
			this.changeCardImage('my', `assets/Fronts/${data.card}.png`, data.index);
		})
		// Receive opponent's cards in order to display them
		this.socket.on('receiveOtherCards', data => {
			// Set their display deck to what I got from the server
			// console.log(`OTHER: ${data}`);
			this.their_cards = [...data];
			this.their_cards.forEach((item, index) => {
				if (item !== ''){
					this.changeCardImage('their', `assets/Fronts/${item}.png`, index);
				}
			});
		})
		// Receive updates on my cards from the server
		this.socket.on('updateCards', data => {
			this.my_cards = [...data];
			// console.log(`MINE: ${this.my_cards}`);
			this.my_cards.forEach((item, index) => {
				if (item !== ''){
					this.changeCardImage('my', `assets/Fronts/${item}.png`, index);
				}
			});
		})
		// Receive the card from the top of the draw pile
		this.socket.on('receiveDrawCard', data => {
			// console.log(`draw card: ${data}`);
			this.topDrawCard = data;
			this.changeCardImage('draw', `assets/Fronts/${data}.png`);
		})
		// Receive top Discard card from the server
		// This happens on replace and discard so it is a good place to reset
		//		the draw booleans
		this.socket.on('receiveDiscardCard', data => {
			// console.log(`discard card: ${data}`);
			this.topDiscardCard = data;
			this.changeCardImage('discard', `assets/Fronts/${data}.png`);
			this.cardDrawnFromDiscardPile = false;
			this.cardDrawnFromDrawPile = false;
		})
		this.socket.on('updateDrawPileCount', data => {
			this.drawPileCount = data;
		})
		this.socket.on('notifyTurn', data => {
			// console.log(`show dialog ${this.showTurnDialog}`);
			// console.log(`notifyTurn: ${data}`);
			this.myTurn = 'is-turn';
			this.theirTurn = '';
		})
		this.socket.on('notifyLastTurn', data => {
			// console.log('FINAL TURN');
			// Use turn dialog
			this.headerMessage = data;
			this.showTurnDialog = true;
			this.myTurn = 'is-turn';
			this.theirTurn = '';
		})
		this.socket.on('announceWinner', data => {
			// console.log('announce winner');
			this.gameOver = true;
			this.headerMessage = data.message;
			this.player1Score = data.p1Score;
			this.player2Score = data.p2Score;
			this.showDialog = true;
		})
		// Flip up all remaining face-down cards
		this.socket.on('revealCards', data => {
			this.revealAllCards(data.yours, data.theirs);
		})
		// Show scores at the end of the round
		this.socket.on('roundSummary', data => {
			// console.log('round summary');
			this.headerMessage = data.message;
			this.player1Score = data.p1Score;
			this.player2Score = data.p2Score;
			this.showDialog = true;
		})
		// Reset before next round
		this.socket.on('nextRoundStart', data => {
			// console.log('next round');
			this.showDialog = false;
			this.chooseTwoPhase = true;
			this.turnsPhase = false;

			this.initializeAllCards(this.cardBackImage);
			this.changeCardImage('discard', `assets/Fronts/${this.topDiscardCard}.png`);

			this.topDrawCard = '';
			// console.log(`draw card: ${this.cardDrawnFromDrawPile}`);
			// console.log(`topdraw card: ${this.topDrawCard}`);
			// console.log(`show dialog card: ${this.showDialog}`);
			// console.log(`choose2 card: ${this.chooseTwoPhase}`);
		})
		// Reset before new game
		this.socket.on('nextGameStart', data => {
			// console.log('next game!');
			this.initializeAllCards(this.cardBackImage);
			this.changeCardImage('discard', `assets/Fronts/${this.topDiscardCard}.png`);
			this.showDialog = false;
			this.gameOver = false;
			this.player1Score = 0;
			this.player2Score = 0;
			this.chooseTwoPhase = true;
			this.turnsPhase = false;

			this.topDrawCard = '';
		})
		// This only gets called if the other player disconnects
		this.socket.on('kickToLobby', data => {
			this.startGame = false;
			this.mainMenu = false;
			this.lobby = true;
			this.readyButtonText = "I'm ready!";
			this.message = '';
			this.player_id = '';
			this.headerMessage = '';
			this.winningPlayer = '';
			this.otherText = '';
			this.showDialog = false;
			this.showTurnDialog = false;
			this.theirTurn = 'is-turn';
			this.myTurn = '';
			this.isSelected = '';
			this.topDiscardCard = '';
			this.topDrawCard = '';
			this.drawPileCount = 0;
			this.my_cards = ['', '', '', '', '', ''];
			this.their_cards = ['', '', '', '', '', ''];
			this.chooseTwoPhase = false;
			this.turnsPhase = false;
			this.cardDrawnFromDrawPile = false;
			this.cardDrawnFromDiscardPile = false;
			this.player1Score = 0;
			this.player2Score = 0;
			this.gameOver = false;
			this.roomId = Math.floor(Math.random()*(99999-10000+1)+10000);
			this.cardBackImage = 'assets/Backs/GlofTheGame.png';
		})
	}

	// This has to use this lifecycle hook in order to avoid changing a variable
	//		while it is still null
	public ngAfterViewChecked() {
		this.changeCardImage('preview', this.cardBackImage);
	}



	// ###################################################################
	// ########################## Actions ################################
	// ###################################################################

	public joinRoom(roomId) {
		if (roomId != '') {
			this.roomId = roomId;
			this.socket.emit('joinRoom', {room: roomId});
		}
	}

	public openMainMenu() {
		if (this.roomId != NaN) {
			this.socket.emit('joinRoom', {room: this.roomId});
		}
	}

	public readyUp() {
		this.socket.emit('playerReadyUp', {room: this.roomId});
		this.readyButtonText = 'Waiting...';
	}

	public chooseCard(cardIndex: number) {
		// This is used during the "choose two" phase
		if (this.chooseTwoPhase && this.my_cards[cardIndex] === '') {
			this.socket.emit('chooseCard', {room: this.roomId, index: cardIndex});
		} 
		// This is used the rest of the time
		else if (this.turnsPhase && this.cardDrawnFromDrawPile || this.turnsPhase && this.cardDrawnFromDiscardPile) {
			this.socket.emit('playerTurn', {room: this.roomId, action: 'replace', data: cardIndex, fromDiscardOrNah: this.cardDrawnFromDiscardPile});
			this.changeCardImage('draw', this.cardBackImage);
			this.myTurn = '';
			this.theirTurn = 'is-turn';
		}
	}

	public drawCardFromDrawPile() {
		if (this.turnsPhase && !this.cardDrawnFromDrawPile && !this.cardDrawnFromDiscardPile) {
			this.socket.emit('playerTurn', {room: this.roomId, action: 'drawFromDrawPile'});
			this.cardDrawnFromDrawPile = true;
		}
	}

	public drawCardFromDiscardPile() {
		if (this.turnsPhase && !this.cardDrawnFromDiscardPile && !this.cardDrawnFromDrawPile) {
			this.cardDrawnFromDiscardPile = true;
			// console.log(`you picked up the ${this.topDiscardCard} from discard`);
		}
	}

	public discardCard() {
		if (this.turnsPhase && this.cardDrawnFromDrawPile) {
			this.socket.emit('playerTurn', {room: this.roomId, action: 'discard'});
			this.changeCardImage('draw', this.cardBackImage);
			this.myTurn = '';
			this.theirTurn = 'is-turn';
		}
	}

	public replaceCard(cardIndex: number) {
		// console.log('replace attempt');
		// console.log(cardIndex);
		if (this.turnsPhase && this.cardDrawnFromDrawPile ||
			this.turnsPhase && this.cardDrawnFromDiscardPile) {
			this.socket.emit('playerTurn', {room: this.roomId, action: 'replace', data: cardIndex, fromDiscardOrNah: this.cardDrawnFromDiscardPile})
			this.changeCardImage('draw', this.cardBackImage);
			this.myTurn = '';
			this.theirTurn = 'is-turn';
		}
	}

	public reset(action: string) {
		// console.log('reset');
		this.socket.emit(action, {room: this.roomId});
	}

	public changeCardImage(card: string, image: string, index?: number) {
		let string_thing = `${card}_card`;
		string_thing += index || index === 0 ? `_${index}` : '';
		// console.log(string_thing);
		const card_to_change = document.getElementById(string_thing) as HTMLImageElement;
		card_to_change.src = image;
	}

	public initializeAllCards(image: string) {
		for (let num = 0; num < 6; num++) {
			this.changeCardImage('their', image, num);
			this.changeCardImage('my', image, num);
		}
		this.changeCardImage('discard', image);
		this.changeCardImage('draw', image);
	}

	public revealAllCards(myCards, theirCards) {
		myCards.forEach((item, index) => {
			this.changeCardImage('my', `assets/Fronts/${item}.png`, index);
		});
		theirCards.forEach((item, index) => {
			this.changeCardImage('their', `assets/Fronts/${item}.png`, index);
		});
	}
}
