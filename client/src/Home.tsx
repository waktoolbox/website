import Menu from "./components/menu";
import MySnackbar from "./components/snackbar";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Account from "./routes/account";
import TournamentHome from "./routes/tournament/tournament-home";
import TournamentView from "./routes/tournament/tournament";
import TournamentEditor from "./routes/tournament/tournament-editor";
import TournamentRegistration from "./routes/tournament/tournament-registration";
import TournamentRegistrationValidation from "./routes/tournament/tournament-registration-validation";
import React from "react";
import jwtDecode from "jwt-decode";
import Draft from "./routes/draft";

export function Home() {
    const params = new URLSearchParams(window.location.search);
    const pathToken = params.get('token');
    if (pathToken) {
        localStorage.setItem('token', pathToken);
        localStorage.setItem("discordId", (jwtDecode(pathToken) as any).discord_id)
        window.location.replace(window.location.origin);
    }

    return (
        <BrowserRouter>
            <Menu/>
            <MySnackbar/>
            <Routes>
                <Route path="/" element={<TournamentHome/>}/>

                <Route path="/account" element={<Account/>}/>
                <Route path="/draft" element={<Draft/>}/>
                <Route path="/draft/:id" element={<Draft/>}/>

                <Route path="/tournament/:id" element={<TournamentView/>}/>
                <Route path="/tournament/:id/tab/:targetTab" element={<TournamentView/>}/>
                <Route path="/tournament/:id/tab/:targetTab/team/:teamId" element={<TournamentView/>}/>
                <Route path="/tournament/:id/tab/:targetTab/match/:matchId" element={<TournamentView/>}/>

                <Route path="/edit-tournament" element={<TournamentEditor/>}/>
                <Route path="/edit-tournament/:id" element={<TournamentEditor/>}/>
                <Route path="/tournament/:id/register"
                       element={<TournamentRegistration/>}/>
                <Route path="/tournament/:id/register/:teamId"
                       element={<TournamentRegistration/>}/>
                <Route path="/tournament/:id/register/:teamId/validate"
                       element={<TournamentRegistrationValidation/>}/>
            </Routes>
        </BrowserRouter>
    )
}