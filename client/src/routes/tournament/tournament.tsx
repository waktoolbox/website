import {useContext, useEffect, useState} from "react";
import {TournamentDefinition} from "../../../../common/tournament/tournament-models";
import {SocketContext} from "../../context/socket-context";
import {useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";

export default function Tournament() {
    const [tournament, setTournament] = useState({});
    const {id} = useParams();
    const socket = useContext(SocketContext)
    const {t} = useTranslation();

    useEffect(() => {

        socket.emit('tournament::get', id, ((t: TournamentDefinition) => {
            setTournament(t);
        }));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div>
            {JSON.stringify(tournament)}
        </div>
    )
}