import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Timer } from '@app/classes/timer/timer';
import { MatchService } from '@app/services/match/match.service';
import { SocketService } from '@app/services/socket/socket.service';
import { COMBAT_TURN_DURATION } from '@common/consts/combat-data.const';
import { MatchData, MatchState } from '@common/interfaces/match-data';
import { CombatEvent } from '@common/interfaces/socket-event.enum';

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    timer: Timer = new Timer(COMBAT_TURN_DURATION);
    private matchService: MatchService = inject(MatchService);
    private socketService: SocketService = inject(SocketService);

    constructor() {
        this.timer.restartTimer(this.matchService.data.combatData.turnDuration);
        this.matchService.matchUpdate.pipe(takeUntilDestroyed()).subscribe(this.onMatchUpdate.bind(this));
    }

    escape() {
        this.socketService.emit(CombatEvent.Escape);
    }

    attack() {
        this.socketService.emit(CombatEvent.Attack);
    }

    private onMatchUpdate(oldMatchData: MatchData) {
        if (oldMatchData.state !== MatchState.CombatWait && this.matchService.isState([MatchState.CombatWait])) {
            this.timer.restartTimer(this.matchService.data.combatData.turnDuration);
        }
    }
}
