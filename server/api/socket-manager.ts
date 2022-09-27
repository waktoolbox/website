import {Server} from "socket.io";
import {verifyToken} from "../oauth/token";

class Manager {
    private io?: Server;

    initIo(io: Server) {
        this.io = io;

        this.io.on('connection', socket => {
            console.log(socket);

            socket.on('authenticate', (token, callback) => {
                const tokenContent = verifyToken(token);
                if (!tokenContent) {
                    callback(false);
                    return socket.disconnect();
                }
                callback(true);
            });
        })
    }
}

export const SocketManager = new Manager();