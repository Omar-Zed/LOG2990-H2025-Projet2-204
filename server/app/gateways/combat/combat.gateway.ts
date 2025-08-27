import { CombatService } from '@app/services/combat/combat.service';
import { MatchService } from '@app/services/match/match.service';
import { CombatEvent } from '@common/interfaces/socket-event.enum';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class CombatGateway {
    @WebSocketServer() private server: Server;
    @Inject(forwardRef(() => MatchService)) private readonly matchService: MatchService;
    @Inject(forwardRef(() => CombatService)) private readonly combatService: CombatService;

    @SubscribeMessage(CombatEvent.Attack)
    attack(socket: Socket) {
        const match = this.matchService.getMatchFromPlayerId(socket.id);
        if (match) {
            this.combatService.attack(match, socket.id);
        }
    }

    @SubscribeMessage(CombatEvent.Escape)
    escape(socket: Socket) {
        const match = this.matchService.getMatchFromPlayerId(socket.id);
        if (match) {
            this.combatService.escape(match, socket.id);
        }
    }
}
