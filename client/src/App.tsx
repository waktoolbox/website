import React from 'react';
import './App.css';
import Menu from "./components/menu";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import TournamentHome from "./routes/tournament/tournament-home";
import Login from "./routes/login";
import TournamentView from "./routes/tournament/tournament";
import TournamentEditor from "./routes/tournament/tournament-editor";
import TournamentRegistration from "./routes/tournament/tournament-registration";
import TournamentRegistrationValidation from "./routes/tournament/tournament-registration-validation";
import TournamentTeam from "./routes/tournament/tournament-team";
import {socket, SocketContext} from "./context/socket-context";
import {UserContextProvider} from "./context/user-context";
import MySnackbar from "./components/snackbar";
import jwtDecode from "jwt-decode";

function App() {
    const params = new URLSearchParams(window.location.search);
    const pathToken = params.get('token');
    if (pathToken) {
        localStorage.setItem('token', pathToken);
        localStorage.setItem("discordId", (jwtDecode(pathToken) as any).discord_id)
        window.location.replace(window.location.origin);
    }

    return (
        <div className="App">
            <UserContextProvider>
                <SocketContext.Provider value={socket}>
                    <BrowserRouter>
                        <Menu/>
                        <MySnackbar/>

                        <Routes>
                            <Route path="/" element={<TournamentHome/>}/>
                            <Route path="/edit-tournament" element={<TournamentEditor/>}/>
                            <Route path="/edit-tournament/:id" element={<TournamentEditor/>}/>
                            <Route path="/tournament/:id" element={<TournamentView/>}/>
                            <Route path="/tournament/:id/register" element={<TournamentRegistration/>}/>
                            <Route path="/tournament/:id/register/:teamId" element={<TournamentRegistration/>}/>
                            <Route path="/tournament/:id/register/:teamId/validate"
                                   element={<TournamentRegistrationValidation/>}/>
                            <Route path="/tournament/:id/team/:teamId" element={<TournamentTeam/>}/>
                            <Route path="/login" element={<Login/>}/>
                        </Routes>
                    </BrowserRouter>
                </SocketContext.Provider>
            </UserContextProvider>
        </div>
    );
}

export default App;
