import React from 'react';
import './App.css';
import Menu from "./components/menu";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Tournament from "./routes/tournament";
import Login from "./routes/login";
import CreateTournament from "./routes/tournament/create-tournament";

function App() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
        localStorage.setItem('token', token);
        window.location.replace(window.location.origin);
    }

    return (
        <div className="App">
            <BrowserRouter>
                <Menu/>

                <Routes>
                    <Route path="/" element={<Tournament/>}/>
                    <Route path="/create-tournament" element={<CreateTournament/>}/>
                    <Route path="/login" element={<Login/>}/>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
