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

	canChooseCard = false;
	canDraw = false;
	canDiscard = false;


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
			this.startGame = data;
			// Once the game has started, allow the players to pick two cards
			this.canChooseCard = data;
		})
		this.socket.on('startTurns', data => {
			console.log('Let the games begin!');
		})
		this.socket.on('receiveCard', data => {
			console.log('MY CARDS');
			console.log(data);
			// Get their cards
		})
		this.socket.on('receiveOtherCard', data => {
			console.log('OTHER CARDS');
			console.log(data);
			// Get their cards
		})
		// Request card (should be dynamic)
		// Receive card (should also be dynamic)
	}

	public turnMove(desiredMove: string) {
		this.socket.emit('move', desiredMove);
	}

	public readyUp() {
		this.socket.emit('playerReadyUp');
	}

	// This is only used during the Card-Choosing phase
	public chooseCard(card: number) {
		if (this.canChooseCard) {
			this.socket.emit('chooseCard', card);
		}
	}

	public requestCard() {
		console.log('');
	}

	public drawCard() {
		if (this.canDraw) {
			console.log('Youre allowed to draw');
		}
	}

	public discardCard() {
		if (this.canDiscard) {
			console.log('Youre allowed to discard');
		}
	}
}