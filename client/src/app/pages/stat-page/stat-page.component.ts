import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, Signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatComponent } from '@app/components/chat/chat.component';
import { HeaderComponent } from '@app/components/header/header.component';
import { SoundEffect } from '@app/interfaces/sound-service';
import { Order, PlayerStatData } from '@app/interfaces/stat-data';
import { PlayerStatType } from '@app/interfaces/stat-type.enum';
import { AudioService } from '@app/services/audio/audio.service';
import { MatchService } from '@app/services/match/match.service';
import { StatService } from '@app/services/stat/stat.service';
import { GameMode } from '@common/interfaces/map-data';

@Component({
    selector: 'app-stat-page',
    templateUrl: './stat-page.component.html',
    styleUrls: ['./stat-page.component.scss'],
    imports: [HeaderComponent, FormsModule, ChatComponent, DatePipe],
})
export class StatPageComponent {
    sortingOrder: WritableSignal<Order> = signal(Order.Ascending);
    sortingStat: WritableSignal<PlayerStatType> = signal(PlayerStatType.Combats);
    playerStatList: Signal<PlayerStatData[]> = computed(() => {
        this.statService.sortPlayerStatsBy(this.sortingStat(), this.sortingOrder());
        return this.statService.playerStats;
    });
    playerStatTypes: PlayerStatType[] = Object.values(PlayerStatType);

    readonly statService: StatService = inject(StatService);
    private readonly matchService: MatchService = inject(MatchService);
    private readonly audioService: AudioService = inject(AudioService);

    constructor() {
        if (this.matchService.isInMatch()) {
            this.statService.initializeData();
        } else {
            this.navigateToMenu();
        }
    }

    updateSorting(statType: PlayerStatType) {
        this.audioService.playEffect(SoundEffect.Click);
        if (statType === this.sortingStat()) {
            this.toggleOrder();
        } else {
            this.sortingOrder.set(Order.Ascending);
        }
        this.updateSortingCriteria(statType);
    }

    navigateToMenu() {
        this.audioService.playEffect(SoundEffect.Click);
        this.matchService.leaveMatch();
    }

    isSelfPlayer(playerId: string) {
        return this.matchService.selfPlayer.id === playerId;
    }

    isModeCTF(): boolean {
        return this.matchService.data.gameData.mapData.gameMode === GameMode.CTF;
    }

    private toggleOrder() {
        const isAscending = this.sortingOrder() === Order.Ascending;
        const inverseOrder = isAscending ? Order.Descending : Order.Ascending;
        this.sortingOrder.set(inverseOrder);
    }

    private updateSortingCriteria(statType: PlayerStatType) {
        this.sortingStat.set(statType);
    }
}
