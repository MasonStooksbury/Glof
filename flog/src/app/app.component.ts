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

	constructor(private gameService: GameService) { }

	public ngOnInit() {
		this.socket = io('http://localhost:709');
	}

	public ngAfterViewInit() {
		this.socket.on('greet', data => {
			this.message = data.message;
			this.player_id = data.player_id;
		})
		this.socket.on('winStatus', data => {
			console.log('winStatus');
			this.showWinStatusDialog = true;
			this.winStatusMessage = data.message;
			this.winningPlayer = data.winningPlayer;
		})
		this.socket.on('startGame', data => {
			this.startGame = data;
		})
	}

	public move(direction: string) {
		this.socket.emit('move', direction);
	}

	public start() {
		this.socket.emit('startGame');
	}
}