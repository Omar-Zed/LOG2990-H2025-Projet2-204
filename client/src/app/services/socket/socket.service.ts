import { Injectable } from '@angular/core';
import { SOCKET_TIMEOUT_DURATION } from '@common/consts/match-data.const';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    private socket: Socket;

    constructor() {
        this.socket = io(environment.socketUrl, {
            transports: ['websocket'],
            upgrade: false,
        });
    }

    get selfId(): string {
        return this.socket.id as string;
    }

    async emit<T, C>(event: string, ...args: T[] | [...T[], (...callbackArgs: C[]) => void]): Promise<boolean> {
        return new Promise((resolve) => {
            const lastArg = args[args.length - 1];
            if (typeof lastArg === 'function') {
                const callback = args.pop() as (...callbackArgs: C[]) => void;
                const timeout = setTimeout(resolve.bind(null, false), SOCKET_TIMEOUT_DURATION);
                this.socket.emit(event, ...args, (...callbackArgs: C[]) => {
                    clearTimeout(timeout);
                    callback(...callbackArgs);
                    resolve(true);
                });
            } else {
                this.socket.emit(event, ...args);
                resolve(true);
            }
        });
    }

    on<T>(event: string, callback: (...args: T[]) => void) {
        this.socket.on(event, callback);
    }
}
