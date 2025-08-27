import { MapData } from './map-data';

export interface GameData {
    _id: string;
    name: string;
    description: string;
    lastEdited: Date;
    isVisible: boolean;
    mapData: MapData;
}
