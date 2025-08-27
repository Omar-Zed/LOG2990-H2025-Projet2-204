import { LobbyService } from '@app/services/lobby/lobby.service';
import { MatchService } from '@app/services/match/match.service';
import { Avatar, PlayerData, PlayerType } from '@common/interfaces/player-data';
import { LobbyEvent } from '@common/interfaces/socket-event.enum';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class LobbyGateway {
    @WebSocketServer() private server: Server;
    @Inject(forwardRef(() => MatchService)) private readonly matchService: MatchService;
    @Inject(forwardRef(() => LobbyService)) private readonly lobbyService: LobbyService;

    @SubscribeMessage(LobbyEvent.KickPlayer)
    kickPlayer(socket: Socket, targetPlayerId: string) {
        const match = this.matchService.getMatchFromPlayerId(socket.id);
        if (match) {
            this.lobbyService.kickPlayer(match, socket.id, targetPlayerId);
        }
    }

    @SubscribeMessage(LobbyEvent.ChangeAvatar)
    changeAvatar(socket: Socket, avatar: Avatar) {
        const match = this.matchService.getMatchFromPlayerId(socket.id);
        if (match) {
            this.lobbyService.changeAvatar(match, socket.id, avatar);
        }
    }

    @SubscribeMessage(LobbyEvent.JoinLobby)
    joinLobby(socket: Socket, playerData: PlayerData) {
        const match = this.matchService.getMatchFromPlayerId(socket.id);
        if (match) {
            this.lobbyService.joinLobby(match, socket.id, playerData);
        }
    }

    @SubscribeMessage(LobbyEvent.ChangeLockStatus)
    changeLockStatus(socket: Socket, lockStatus: boolean) {
        const match = this.matchService.getMatchFromPlayerId(socket.id);
        if (match) {
            this.lobbyService.changeLockStatus(match, socket.id, lockStatus);
        }
    }

    @SubscribeMessage(LobbyEvent.StartMatch)
    startMatch(socket: Socket) {
        const match = this.matchService.getMatchFromPlayerId(socket.id);
        if (match) {
            this.lobbyService.startMatch(match, socket.id);
        }
    }

    @SubscribeMessage(LobbyEvent.AddBot)
    addBot(socket: Socket, botType: PlayerType) {
        const match = this.matchService.getMatchFromPlayerId(socket.id);
        if (match) {
            this.lobbyService.addBot(match, botType);
        }
    }
}
