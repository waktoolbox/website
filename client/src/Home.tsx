import Menu from "./components/menu";
import MySnackbar from "./components/snackbar";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import TournamentHome from "./routes/tournament/tournament-home";
import Login from "./routes/login";
import TournamentView from "./routes/tournament/tournament";
import TournamentTeam from "./routes/tournament/tournament-team";
import TournamentEditor from "./routes/tournament/tournament-editor";
import TournamentRegistration from "./routes/tournament/tournament-registration";
import TournamentRegistrationValidation from "./routes/tournament/tournament-registration-validation";
import React, {useContext} from "react";
import jwtDecode from "jwt-decode";
import {UserContext} from "./context/user-context";

export function Home() {
    const params = new URLSearchParams(window.location.search);
    const pathToken = params.get('token');
    if (pathToken) {
        localStorage.setItem('token', pathToken);
        localStorage.setItem("discordId", (jwtDecode(pathToken) as any).discord_id)
        window.location.replace(window.location.origin);
    }

    const userContext = useContext(UserContext)
    return (
        <BrowserRouter>
            <Menu/>
            <MySnackbar/>

            <Routes>
                <Route path="/" element={<TournamentHome/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/tournament/:id" element={<TournamentView/>}/>
                <Route path="/tournament/:id/team/:teamId" element={<TournamentTeam/>}/>

                <Route path="/edit-tournament" element={userContext?.userState?.connected ? <TournamentEditor/> :
                    <Navigate replace to={"/login"}/>}/>
                <Route path="/edit-tournament/:id" element={userContext?.userState?.connected ? <TournamentEditor/> :
                    <Navigate replace to={"/login"}/>}/>
                <Route path="/tournament/:id/register"
                       element={userContext?.userState?.connected ? <TournamentRegistration/> :
                           <Navigate replace to={"/login"}/>}/>
                <Route path="/tournament/:id/register/:teamId"
                       element={userContext?.userState?.connected ? <TournamentRegistration/> :
                           <Navigate replace to={"/login"}/>}/>
                <Route path="/tournament/:id/register/:teamId/validate"
                       element={userContext?.userState?.connected ? <TournamentRegistrationValidation/> :
                           <Navigate replace to={"/login"}/>}/>
            </Routes>
        </BrowserRouter>
    )
}