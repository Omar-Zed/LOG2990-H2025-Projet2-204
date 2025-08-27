export interface PlayVisualData {
    canUseAction: boolean;
    canEndTurn: boolean;
    currentPlayerCount: number;
    players: PlayerVisualData[];
    selfAvatarUrl: string;
    movementLeft: number;
    thumbnailUrl: string;
    isInventoryFull: boolean;
}

export interface PlayerVisualData {
    id: string;
    name: string;
    avatarUrl: string;
    combatsWon: number;
    isHost: boolean;
    isConnected: boolean;
    botType: string;
    team: string;
    hasFlag: boolean;
}
