import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import io from 'socket.io-client';
import "primeflex/primeflex.css";
import { GameService } from './services/game/game.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {	
	context: any;
	socket: any;

	card_theme = 'assets/Test_Card_Smoller.png';

	startGame = false;

	message = '';
	player_id = '';
	winStatusMessage = '';
	winningPlayer = '';
	showWinStatusDialog = false;

	// Each card will start off as an empty string
	my_cards = ['', '', '', '', '', ''];
	their_cards = ['', '', '', '', '', ''];

	// Phase booleans
	chooseTwoPhase = false;
	turnsPhase = false;

	// We have both to prevent drawing from and then discarding to the discard pile
	cardDrawnFromDrawPile = false;
	cardDrawnFromDiscardPile = false;

	topDiscardCard = '';
	topDrawCard = ''


	constructor(private gameService: GameService) { }

	public ngOnInit() {
		this.socket = io('http://localhost:709');
	}

	public ngAfterViewInit() {
		this.socket.on('connection', data => {
			this.message = data.message;
			this.player_id = data.player_id;
		})
		this.socket.on('winStatus', data => {
			this.showWinStatusDialog = true;
			this.winStatusMessage = data.message;
			this.winningPlayer = data.winningPlayer;
		})
		this.socket.on('startGame', data => {
			this.startGame = true;
			this.topDiscardCard = data;
			// Once the game has started, allow the players to pick two cards
			this.chooseTwoPhase = true;
		})
		this.socket.on('startTurns', data => {
			this.chooseTwoPhase = false;
			this.turnsPhase = true;
		})
		this.socket.on('receiveCard', data => {
			this.my_cards[data.index] = data.card;
		})
		this.socket.on('receiveOtherCards', data => {
			// Set their display deck to what I got from the server
			console.log(`OTHER: ${data}`);
			this.their_cards = [...data];
		})
		this.socket.on('updateCards', data => {
			this.my_cards = [...data];
			console.log(`MINE: ${this.my_cards}`);
		})
		this.socket.on('receiveDrawCard', data => {
			console.log(`draw card: ${data}`);
			this.topDrawCard = data;
		})
		this.socket.on('receiveDiscardCard', data => {
			console.log(`discard card: ${data}`);
			this.topDiscardCard = data;
			this.cardDrawnFromDiscardPile = false;
			this.cardDrawnFromDrawPile = false;
		})
	}

	public turnMove(desiredMove: string) {
		this.socket.emit('move', desiredMove);
	}

	public readyUp() {
		this.socket.emit('playerReadyUp');
	}

	// This is only used during the Card-Choosing phase
	public chooseCard(cardIndex: number) {
		if (this.chooseTwoPhase && this.my_cards[cardIndex] === '') {
			this.socket.emit('chooseCard', cardIndex);
		}
	}

	public drawCardFromDrawPile() {
		if (this.turnsPhase && !this.cardDrawnFromDrawPile && !this.cardDrawnFromDiscardPile) {
			this.socket.emit('playerTurn', {action: 'drawFromDrawPile'});
			this.cardDrawnFromDrawPile = true;
		}
	}

	public drawCardFromDiscardPile() {
		if (this.turnsPhase && !this.cardDrawnFromDiscardPile && !this.cardDrawnFromDrawPile) {
			this.socket.emit('playerTurn', 'draw');
			this.cardDrawnFromDiscardPile = true;
		}
	}

	public discardCard() {
		if (this.turnsPhase && this.cardDrawnFromDrawPile) {
			this.socket.emit('playerTurn', {action: 'discard', data: this.topDrawCard});
		}
	}

	public replaceCard(cardIndex: number) {
		if (this.turnsPhase && this.cardDrawnFromDrawPile ||
			this.turnsPhase && this.cardDrawnFromDiscardPile) {
			this.socket.emit('playerTurn', {action: 'replace', data: cardIndex})
		}
	}
}