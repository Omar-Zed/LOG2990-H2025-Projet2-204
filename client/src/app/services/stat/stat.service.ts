import { inject, Injectable } from '@angular/core';
import { BATTLE_PLATFORM_IMAGES } from '@app/consts/images.const';
import { GlobalStatData, Order, PlayerStatData, TotalTiles, WinnerVisualData } from '@app/interfaces/stat-data';
import { PlayerStatType } from '@app/interfaces/stat-type.enum';
import { MatchService } from '@app/services/match/match.service';
import { AVATAR_DATA } from '@common/consts/avatar-data.const';
import { DECIMAL_FACTOR, PERCENTAGE_FACTOR } from '@common/consts/track-data.const';
import { TrackingData } from '@common/interfaces/match-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';

@Injectable({
    providedIn: 'root',
})
export class StatService {
    winnerData: WinnerVisualData;
    globalStats: GlobalStatData;
    playerStats: PlayerStatData[];

    private trackingData: TrackingData;
    private mapTotalTiles: TotalTiles;
    private matchService: MatchService = inject(MatchService);

    initializeData() {
        this.trackingData = this.matchService.data.trackingData;
        this.mapTotalTiles = this.getTotalTiles();
        this.winnerData = this.getWinnerAssets();
        this.globalStats = this.getGlobalStats();
        this.playerStats = this.getPlayerStats();
    }

    sortPlayerStatsBy(statType: PlayerStatType, order: Order) {
        this.playerStats.sort((playerX, playerY) => {
            const ascendingComparator = playerY[statType] - playerX[statType];
            const descendingComparator = playerX[statType] - playerY[statType];
            return order === Order.Ascending ? ascendingComparator : descendingComparator;
        });
    }

    private getGlobalStats(): GlobalStatData {
        return {
            gameDuration: this.getGameDuration(),
            toggledBridgesRatio: this.getBridgeRatio(),
            visitedTilesRatio: this.getTileRatio(this.trackingData.coveredGroundTiles),
            rounds: this.trackingData.rounds,
            flagHoldersCount: this.trackingData.flagHoldersCount,
        };
    }

    private getPlayerStats(): PlayerStatData[] {
        const playerStats: PlayerStatData[] = [];
        for (const player of this.trackingData.players) {
            playerStats.push({
                id: player.id,
                name: player.name,
                team: player.team,
                [PlayerStatType.DiscoveredItemsCount]: player.pickedUpItems.length,
                [PlayerStatType.VisitedTilesRatio]: this.getTileRatio(player.coveredGroundTiles),
                [PlayerStatType.Combats]: player.combats,
                [PlayerStatType.Victories]: player.victories,
                [PlayerStatType.Defeats]: player.defeats,
                [PlayerStatType.Escapes]: player.escapes,
                [PlayerStatType.HpInflicted]: player.hpInflicted,
                [PlayerStatType.HpLost]: player.hpLost,
            });
        }
        return playerStats;
    }

    private getGameDuration(): number {
        return this.trackingData.endTime - this.trackingData.startTime;
    }

    private getWinnerAssets(): WinnerVisualData {
        const avatarImage = AVATAR_DATA[this.trackingData.matchWinner.avatar].frontGif;
        const tileImage = BATTLE_PLATFORM_IMAGES[this.trackingData.matchWinner.tile].enemyPlatform;
        const name = this.trackingData.matchWinner.name;
        return {
            name,
            avatarImage,
            tileImage,
        };
    }

    private getBridgeRatio(): number {
        if (this.mapTotalTiles.bridge) {
            const nToggledBridges = this.trackingData.coveredBridges.length;
            const nBridges = this.mapTotalTiles.bridge;
            return this.getRatio(nToggledBridges, nBridges);
        }
        return 0;
    }

    private getTileRatio(coveredTiles: Position[]): number {
        const nCoveredTiles = coveredTiles.length;
        return this.getRatio(nCoveredTiles, this.mapTotalTiles.ground);
    }

    private getRatio(currentElements: number, totalElements: number): number {
        return Math.round((currentElements / totalElements) * PERCENTAGE_FACTOR * DECIMAL_FACTOR) / DECIMAL_FACTOR;
    }

    private getTotalTiles(): TotalTiles {
        const isGroundTile = (tile: TileType) => [TileType.Path, TileType.Grass, TileType.Bush].includes(tile);
        const isBridge = (tile: TileType) => [TileType.Bridge, TileType.BrokenBridge].includes(tile);
        const mapTotalTiles: TotalTiles = { ground: 0, bridge: 0 };
        const mapData = this.matchService.data.gameData.mapData;
        for (const tileRow of mapData.tiles) {
            for (const tile of tileRow) {
                if (isGroundTile(tile)) {
                    mapTotalTiles.ground++;
                } else if (isBridge(tile)) {
                    mapTotalTiles.bridge++;
                }
            }
        }
        return mapTotalTiles;
    }
}
