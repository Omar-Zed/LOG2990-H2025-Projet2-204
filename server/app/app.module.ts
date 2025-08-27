import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GameController } from './controllers/game/game.controller';
import { ChatGateway } from './gateways/chat/chat.gateway';
import { CombatGateway } from './gateways/combat/combat.gateway';
import { LobbyGateway } from './gateways/lobby/lobby.gateway';
import { MatchGateway } from './gateways/match/match.gateway';
import { PlayGateway } from './gateways/play/play.gateway';
import { Game, gameSchema } from './model/schema/game.schema';
import { BotService } from './services/bot/bot.service';
import { ChatService } from './services/chat/chat.service';
import { CombatService } from './services/combat/combat.service';
import { GameService } from './services/game/game.service';
import { ItemService } from './services/item/item.service';
import { LobbyService } from './services/lobby/lobby.service';
import { MapService } from './services/map/map.service';
import { MatchService } from './services/match/match.service';
import { PlayService } from './services/play/play.service';
import { TrackingService } from './services/tracking/tracking.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'),
            }),
        }),
        MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }]),
    ],
    controllers: [GameController],
    providers: [
        Logger,

        GameService,
        MatchService,
        LobbyService,
        PlayService,
        CombatService,
        MapService,
        ChatService,
        BotService,
        ItemService,

        MatchGateway,
        LobbyGateway,
        PlayGateway,
        CombatGateway,
        ChatGateway,
        TrackingService,
    ],
})
export class AppModule {}
