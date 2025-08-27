import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Timer } from '@app/classes/timer/timer';
import { MapService } from '@app/services/map/map.service';
import { MatchService } from '@app/services/match/match.service';
import { MovementService } from '@app/services/movement/movement.service';
import { SocketService } from '@app/services/socket/socket.service';
import { TURN_WAIT_DURATION } from '@common/consts/match-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MatchData, MatchState } from '@common/interfaces/match-data';
import { Position } from '@common/interfaces/position';
import { PlayEvent } from '@common/interfaces/socket-event.enum';

@Injectable({
    providedIn: 'root',
})
export class PlayService {
    timer: Timer = new Timer(TURN_WAIT_DURATION);
    private socketService: SocketService = inject(SocketService);
    private matchService: MatchService = inject(MatchService);
    private mapService: MapService = inject(MapService);
    private movementService: MovementService = inject(MovementService);

    constructor() {
        this.onMatchUpdate(this.matchService.data);
        this.matchService.matchUpdate.pipe(takeUntilDestroyed()).subscribe(this.onMatchUpdate.bind(this));
    }

    endTurn() {
        this.socketService.emit(PlayEvent.EndTurn);
    }

    rightClickTile(position: Position) {
        if (this.matchService.data.playData.isDebugMode && this.matchService.isActivePlayer()) {
            this.socketService.emit(PlayEvent.DebugMove, position);
        }
    }

    clickTile(position: Position) {
        const selfPosition = this.matchService.selfPlayer.position;
        const clickedItself = selfPosition.x === position.x && selfPosition.y === position.y;

        if (!clickedItself && this.matchService.isActivePlayer() && this.matchService.isState([MatchState.TurnWait])) {
            if (this.mapService.hasActionOverlay()) {
                this.socketService.emit(PlayEvent.Action, position);
            } else {
                this.socketService.emit(PlayEvent.Move, position);
            }
        }

        this.mapService.clearActions();
    }

    displayActions() {
        const possibleActions = this.movementService.getActions(this.matchService.data);
        this.mapService.setActions(possibleActions, this.matchService.selfPlayer.position);
    }

    displayMovementPath(targetPositon: Position) {
        const shortestPath = this.movementService.getShortestPath(this.matchService.data, targetPositon);
        const hasEnoughMovement = shortestPath.moveCost <= this.matchService.data.playData.movementLeft;
        if (hasEnoughMovement && this.matchService.isState([MatchState.TurnWait]) && this.matchService.isActivePlayer()) {
            this.mapService.setHoverMoves(shortestPath.path);
        } else {
            this.mapService.setHoverMoves([]);
        }
    }

    changeDebugMode() {
        if (this.matchService.isHost()) {
            this.socketService.emit(PlayEvent.ChangeDebugMode, !this.matchService.data.playData.isDebugMode);
        }
    }

    dropItem(itemType: ItemType) {
        this.socketService.emit(PlayEvent.DropItem, itemType);
    }

    private onMatchUpdate(oldMatchData: MatchData) {
        this.updateOverlays();
        this.updateMovement(oldMatchData);
        this.updateTimer();
    }

    private updateTimer() {
        if (this.matchService.isState([MatchState.TurnWait])) {
            this.timer.startTimer();
        } else {
            this.timer.pauseTimer(this.matchService.data.playData.timeLeft);
        }
    }

    private updateMovement(oldMatchData: MatchData) {
        if (this.matchService.isState([MatchState.MovementAnimation])) {
            const newPosition = this.matchService.data.players[this.matchService.data.playData.activePlayerIndex].position;
            const shortestPath = this.movementService.getShortestPath(oldMatchData, newPosition);
            this.mapService.movePlayer(this.matchService.data.playData.activePlayerIndex, shortestPath.path);
        } else {
            this.mapService.setPlayers(this.matchService.data.players);
        }
    }

    private updateOverlays() {
        if (this.matchService.isState([MatchState.TurnWait]) && this.matchService.isActivePlayer()) {
            this.displayPossibleMoves();
        } else {
            this.mapService.clearOverlays();
        }
    }

    private displayPossibleMoves() {
        const possibleMoves = this.movementService.getPossibleMoves(this.matchService.data);
        this.mapService.setPossibleMoves(possibleMoves, this.matchService.selfPlayer.position);
    }
}
