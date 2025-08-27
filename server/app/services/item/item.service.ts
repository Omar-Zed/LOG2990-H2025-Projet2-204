import { Match } from '@app/classes/match/match';
import { ChatService } from '@app/services/chat/chat.service';
import { MapService } from '@app/services/map/map.service';
import { PlayService } from '@app/services/play/play.service';
import { TrackingService } from '@app/services/tracking/tracking.service';
import { AVATAR_EVOLVED_SUFFIX, AVATAR_SHINY_SUFFIX, MAX_ITEMS } from '@common/consts/player-data.const';
import { ItemType } from '@common/interfaces/item-type.enum';
import { MatchState } from '@common/interfaces/match-data';
import { Avatar, AvatarModifiers, PlayerData } from '@common/interfaces/player-data';
import { forwardRef, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ItemService {
    @Inject(MapService) private readonly mapService: MapService;
    @Inject(TrackingService) private readonly trackingService: TrackingService;
    @Inject(forwardRef(() => PlayService)) private readonly playService: PlayService;
    @Inject(forwardRef(() => ChatService)) private readonly chatService: ChatService;

    dropItems(match: Match, playerId: string, items: ItemType[]) {
        const player = match.getPlayer(playerId);
        for (const item of items) {
            const position = this.mapService.getNearestItemDropSpot(match.data, player.position);
            match.data.gameData.mapData.items[item].push(position);
            player.items = player.items.filter((i) => i !== item);
        }
        this.computeItems(player);
    }

    checkAndPickupItem(match: Match, playerData: PlayerData) {
        const position = playerData.position;
        const item = this.mapService.getItemTypeAtPosition(match.data, position);
        if (item) {
            this.handleItemAddition(match, playerData, item);
            this.trackingService.updateItems(match, item, playerData.id);
        }
    }

    forceItemDrop(match: Match, playerId: string) {
        match.data.state = MatchState.TurnWait;
        const player = match.getPlayer(playerId);
        if (player.isConnected) {
            this.dropItems(match, playerId, [player.items[MAX_ITEMS]]);
        }
        this.playService.continueTurn(match);
    }

    private handleItemAddition(match: Match, player: PlayerData, itemType: ItemType) {
        player.items.push(itemType);
        this.chatService.logItemPickup(match, player.name, itemType);
        match.data.gameData.mapData.items[itemType] = match.data.gameData.mapData.items[itemType].filter(
            (itemPos) => itemPos.x !== player.position.x || itemPos.y !== player.position.y,
        );

        if (player.items.length > MAX_ITEMS) {
            match.data.state = MatchState.ItemWait;
            return;
        }

        this.computeItems(player);
    }

    private computeItems(player: PlayerData) {
        const isShiny = player.items.includes(ItemType.Item1);
        const isEvolved = player.items.includes(ItemType.Item2);
        const isMissingNo = player.items.includes(ItemType.Item6);
        player.avatar = this.getAvatarVariant(player.avatar, { isShiny, isEvolved, isMissingNo });
    }

    private getAvatarVariant(avatar: Avatar, avatarModifiers: AvatarModifiers): Avatar {
        const baseMatch = avatar.match(/^(avatar\d+)/);
        if (!baseMatch) {
            return avatar;
        }

        const base = baseMatch[1];
        let result = base;

        if (avatarModifiers.isEvolved) {
            result += AVATAR_EVOLVED_SUFFIX;
        }
        if (avatarModifiers.isShiny) {
            result += AVATAR_SHINY_SUFFIX;
        }

        return result as Avatar;
    }
}
