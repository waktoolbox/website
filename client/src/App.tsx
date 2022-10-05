import React from 'react';
import './App.css';
import {socket, SocketContext} from "./context/socket-context";
import {UserContextProvider} from "./context/user-context";
import {Home} from "./Home";

function App() {
    return (
        <div className="App">
            <UserContextProvider>
                <SocketContext.Provider value={socket}>
                    <Home/>
                </SocketContext.Provider>
            </UserContextProvider>
        </div>
    );
}

export default App;
