import {createContext} from 'react';
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_BACKEND_URL as string);
export const SocketContext = createContext(socket);
export const SocketProvider = ({children}: any) => {
    return (
        <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
    );
};