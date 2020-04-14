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

	startGame = false;

	message = '';
	player_id = '';
	winStatusMessage = '';
	winningPlayer = '';
	showWinStatusDialog = false;

	theme1 = 'assets/Test_Card_Smoller.png';

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
}