export enum MatchEvent {
    CreateMatch = 'createMatch',
    JoinMatch = 'joinMatch',
    LeaveMatch = 'leaveMatch',

    Update = 'update',
    Message = 'message',
    Popup = 'popup',
    RemovedFromMatch = 'removedFromMatch',
    Disconnect = 'disconnect',
}

export enum LobbyEvent {
    KickPlayer = 'kickPlayer',
    ChangeAvatar = 'changeAvatar',
    JoinLobby = 'joinLobby',
    ChangeLockStatus = 'changeLockStatus',
    StartMatch = 'startMatch',
    AddBot = 'addBot',
}

export enum PlayEvent {
    EndTurn = 'endTurn',
    Move = 'move',
    Action = 'action',
    DebugMove = 'debugMove',
    ChangeDebugMode = 'changeDebugMode',
    DropItem = 'dropItem',
}

export enum CombatEvent {
    Attack = 'attack',
    Escape = 'escape',
}

export enum ChatEvent {
    Message = 'message',
}
