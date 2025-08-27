export interface ChatMessage {
    sender?: string;
    content: string;
    timestamp: Date;
}

export interface ChatLog extends ChatMessage {
    concernedPlayersNamesList: string[];
}
