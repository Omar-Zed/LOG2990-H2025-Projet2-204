export interface LobbyVisualData {
    players: LobbyPlayerVisualData[];
    isSelfHost: boolean;
}

export interface LobbyPlayerVisualData {
    isConnected: boolean;
    name: string;
    isHost: boolean;
    isSelf: boolean;
    avatarImage: string;
    health: number;
    id: string;
    playerType: string;
}
