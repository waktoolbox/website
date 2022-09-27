import React from 'react';
import './App.css';
import Menu from "./components/menu";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Tournament from "./routes/tournament";
import Login from "./routes/login";
import CreateTournament from "./routes/tournament/create-tournament";
import {socket, SocketContext} from "./context/socket-context";
import {UserContextProvider} from "./context/user-context";

function App() {
    const params = new URLSearchParams(window.location.search);
    const pathToken = params.get('token');
    if (pathToken) {
        localStorage.setItem('token', pathToken);
        window.location.replace(window.location.origin);
    }

    return (
        <div className="App">
            <UserContextProvider>
                <SocketContext.Provider value={socket}>
                    <BrowserRouter>
                        <Menu/>

                        <Routes>
                            <Route path="/" element={<Tournament/>}/>
                            <Route path="/create-tournament" element={<CreateTournament/>}/>
                            <Route path="/login" element={<Login/>}/>
                        </Routes>
                    </BrowserRouter>
                </SocketContext.Provider>
            </UserContextProvider>
        </div>
    );
}

export default App;
