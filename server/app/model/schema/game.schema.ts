import { ItemType } from '@common/interfaces/item-type.enum';
import { MapSize, GameMode } from '@common/interfaces/map-data';
import { Position } from '@common/interfaces/position';
import { TileType } from '@common/interfaces/tile-type.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

export class MapData {
    @ApiProperty()
    @Prop({ required: true, type: Array })
    tiles: TileType[][];

    @ApiProperty()
    @Prop({ required: true, type: Object })
    items: Record<ItemType, Position[]>;

    @ApiProperty({ enum: MapSize })
    @Prop({ required: true })
    size: MapSize;

    @ApiProperty({ enum: GameMode })
    @Prop({ required: true })
    gameMode: GameMode;
}

@Schema()
export class Game {
    @ApiProperty()
    @Prop({ required: true })
    name: string;

    @ApiProperty()
    @Prop({ required: true })
    description: string;

    @ApiProperty()
    @Prop({ required: true, default: () => new Date() })
    lastEdited: Date;

    @ApiProperty()
    @Prop({ required: true, default: true })
    isVisible: boolean;

    @ApiProperty()
    @Prop({ required: true, type: Object })
    mapData: MapData;

    @ApiProperty()
    _id?: string;
}

export const gameSchema = SchemaFactory.createForClass(Game);
