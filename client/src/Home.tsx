import Menu from "./components/menu";
import MySnackbar from "./components/snackbar";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import TournamentHome from "./routes/tournament/tournament-home";
import Login from "./routes/login";
import TournamentView from "./routes/tournament/tournament";
import TournamentTeam from "./routes/tournament/tournament-team";
import TournamentEditor from "./routes/tournament/tournament-editor";
import TournamentRegistration from "./routes/tournament/tournament-registration";
import TournamentRegistrationValidation from "./routes/tournament/tournament-registration-validation";
import React from "react";
import jwtDecode from "jwt-decode";
import {useTranslation} from "react-i18next";

export function Home() {
    const {t} = useTranslation();
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
                <Route path="/login" element={<Login/>}/>
                <Route path="/tournament/:id" element={<TournamentView/>}/>
                <Route path="/tournament/:id/team/:teamId" element={<TournamentTeam/>}/>

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