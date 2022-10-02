import {useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Card, CardContent, Grid} from "@mui/material";
import {useState} from "react";

export default function TournamentTeam() {
    const {t} = useTranslation();
    const {id, teamId} = useParams();
    const [team, setTeam] = useState({})

    return (
        <Card>
            <CardContent>
                <Grid container>
                    <Grid item xs={12}>

                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}