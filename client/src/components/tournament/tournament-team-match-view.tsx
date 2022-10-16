import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CancelIcon from '@mui/icons-material/Cancel';
import {TournamentMatchModel} from "../../utils/tournament-models";
import {Button, Card, CardContent, Divider, Grid, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import React from "react";

const dateFormat = {
    date: {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', timeZoneName: 'short'
    }
}

export default function TournamentTeamMatchView({
                                                    match,
                                                    displayedTeam,
                                                    displayedTeamName,
                                                    otherTeamName,
                                                    goToMatch,
                                                    backgroundColor = "#162329"
                                                }: { match: TournamentMatchModel, displayedTeam: string | undefined, displayedTeamName?: string, otherTeamName: string, goToMatch: any, backgroundColor?: string }) {
    const {t} = useTranslation();

    return (
        <Card sx={{
            mt: 3, mr: 3, mb: 3,
            borderRadius: 4,
            boxShadow: '5px 5px 15px 0px #000000',
            '&.MuiCardContent-root': {p: 2},
        }}>
            <CardContent sx={{
                backgroundColor: backgroundColor, textAlign: "start",
                "&:last-child": {
                    pb: 2
                }
            }}>
                <Grid container direction="row" alignItems="center">
                    {displayedTeam &&
                        <Grid item xs={1}>
                            {match.winner && match.winner === displayedTeam &&
                                <EmojiEventsIcon sx={{
                                    width: "80%",
                                    height: '80%',
                                    display: "flex",
                                    verticalAlign: "center",
                                    color: "#07c6b6"
                                }}/>
                            }
                            {match.winner && match.winner !== displayedTeam &&
                                <CancelIcon sx={{
                                    width: "80%",
                                    height: '80%',
                                    display: "flex",
                                    verticalAlign: "center",
                                    color: "#00A4E9"
                                }}/>
                            }
                        </Grid>
                    }
                    <Grid item xs={4} sx={{mt: "2px"}}>
                        <Typography>
                            <b>{!match.date ? t('tournament.display.match.noDate') : t('date', {
                                date: Date.parse(match.date),
                                formatParams: dateFormat
                            })}</b>
                        </Typography>
                        <Typography sx={{color: "#848889", whiteSpace: "pre-line"}}>
                            {match.rounds && match.rounds.map((r, i) => `${i + 1}. ` + t(`maps.${r.map}`) + "\n")}
                        </Typography>
                    </Grid>
                    <Grid item xs={5} sx={{height: "100%"}}>
                        <Divider sx={{pt: 2, pb: 3, m: 0, mr: 2, display: "inline"}} orientation="vertical"
                                 variant="middle"/>
                        {displayedTeamName &&
                            <Typography variant="h6" sx={{verticalAlign: "middle"}}
                                        display="inline"><b>{displayedTeamName}</b> </Typography>
                        }
                        <Typography sx={{verticalAlign: "middle", mr: 1}} display="inline"><span
                            className="blueWord">vs</span></Typography>
                        <Typography variant="h6" sx={{verticalAlign: "middle"}} display="inline"><b>{otherTeamName}</b></Typography>
                    </Grid>
                    <Grid item xs={displayedTeam ? 2 : 3}>
                        <Button sx={{
                            borderColor: '#00ead1 !important',
                            color: '#fefffa',
                            backgroundColor: '#213a41',
                            fontSize: "0.6rem",
                            float: "right"
                        }} variant="outlined" onClick={goToMatch}>
                            {t('tournament.display.match.more')}
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}