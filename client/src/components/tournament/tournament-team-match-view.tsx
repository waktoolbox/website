import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CancelIcon from '@mui/icons-material/Cancel';
import {TournamentMatchModel} from "../../../../common/tournament/tournament-models";
import {Button, Card, CardContent, Divider, Grid, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import React from "react";

export default function TournamentTeamMatchView({
                                                    match,
                                                    displayedTeam,
                                                    otherTeamName,
                                                    goToMatch
                                                }: { match: TournamentMatchModel, displayedTeam: string | undefined, otherTeamName: string, goToMatch: any }) {
    const {t} = useTranslation();

    return (
        <Card sx={{
            mt: 3, mr: 3, mb: 3,
            borderRadius: 4,
            boxShadow: '5px 5px 15px 0px #000000',
            '&.MuiCardContent-root': {p: "16px"}
        }}>
            <CardContent sx={{backgroundColor: "#162329", textAlign: "start"}}>
                <Grid container direction="row" alignItems="center">
                    <Grid item xs={1}>
                        {match.winner && match.winner === displayedTeam &&
                            <EmojiEventsIcon sx={{width: "100%", height: '100%'}}/>
                        }
                        {match.winner && match.winner !== displayedTeam &&
                            <CancelIcon sx={{width: "100%", height: '100%'}}/>
                        }
                    </Grid>
                    <Grid item xs={4} sx={{mt: "2px"}}>
                        <Typography>
                            <b>{!match.date ? t('tournament.display.match.noDate') : match.date}</b>
                        </Typography>
                        <Typography sx={{color: "#848889"}}>
                            {match.rounds && match.rounds.map(r => t(`maps.${r.map}`)).join(', ')}
                        </Typography>
                    </Grid>
                    <Grid item xs={5} sx={{height: "100%"}}>
                        <Divider sx={{pt: 2, pb: 3, m: 0, mr: 2, display: "inline"}} orientation="vertical"
                                 variant="middle"/>
                        <Typography sx={{verticalAlign: "middle", mr: 1}} display="inline"><span
                            className="blueWord">vs</span></Typography>
                        <Typography sx={{verticalAlign: "middle"}} display="inline">{otherTeamName}</Typography>
                    </Grid>
                    <Grid item xs={2}>
                        <Button sx={{
                            borderColor: '#00ead1 !important',
                            color: '#fefffa',
                            backgroundColor: '#213a41',
                            fontSize: "0.6rem"
                        }} variant="outlined" onClick={goToMatch}>
                            {t('tournament.display.match.more')}
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}