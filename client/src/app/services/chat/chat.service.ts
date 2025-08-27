import { inject, Injectable, signal } from '@angular/core';
import { SocketService } from '@app/services/socket/socket.service';
import { ChatEvent } from '@common/interfaces/socket-event.enum';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    isChatActive = signal(true);
    isFilterEnabled = signal(false);
    private socketService: SocketService = inject(SocketService);

    sendMessage(message: string) {
        this.socketService.emit(ChatEvent.Message, message);
    }
}
