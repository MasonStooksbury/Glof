import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import io from "socket.io-client";
import { GameService } from './services/game/game.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
	@ViewChild("game", {static: false})

	gameCanvas: ElementRef;
	context: any;
	socket: any;

	message = '';
	player_id = '';
	winStatusMessage = '';
	winningPlayer = '';
	showWinStatusDialog = false;

	constructor(private gameService: GameService) { }

	public ngOnInit() {
		this.socket = io("http://localhost:709");
	}

	public ngAfterViewInit() {
		this.context = this.gameCanvas.nativeElement.getContext("2d");
		this.socket.on("position", data => {
			this.context.clearRect(0, 0, this.gameCanvas.nativeElement.width, this.gameCanvas.nativeElement.height);
			this.context.fillRect(data.x, data.y, 20, 20);
		});
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
	}

	public move(direction: string) {
		this.socket.emit("move", direction);
	}
}