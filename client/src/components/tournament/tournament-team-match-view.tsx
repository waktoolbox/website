import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CancelIcon from '@mui/icons-material/Cancel';
import {TournamentMatchModel} from "../../utils/tournament-models";
import {Button, Card, CardContent, Divider, Grid, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import React from "react";
import {Link, useParams} from "react-router-dom";

const dateFormat = {
    date: {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', timeZoneName: 'short'
    }
}

export default function TournamentTeamMatchView({
                                                    tournamentId,
                                                    match,
                                                    displayedTeam,
                                                    displayedTeamName,
                                                    otherTeamName,
                                                    goToMatch,
                                                    backgroundColor = "#162329"
                                                }: { tournamentId: string, match: TournamentMatchModel, displayedTeam: string | undefined, displayedTeamName?: string, otherTeamName: string, goToMatch: any, backgroundColor?: string }) {
    const {t} = useTranslation();
    const {teamId} = useParams();

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
                    {displayedTeam && match.winner &&
                        <Grid item xs={1}>
                            {match.winner && match.winner === displayedTeam &&
                                <EmojiEventsIcon sx={{
                                    width: "80%",
                                    height: '80%',
                                    display: "flex",
                                    verticalAlign: "middle",
                                    color: "#07c6b6"
                                }}/>
                            }
                            {match.winner && match.winner !== displayedTeam &&
                                <CancelIcon sx={{
                                    width: "80%",
                                    height: '80%',
                                    display: "flex",
                                    verticalAlign: "middle",
                                    color: "#e64b4b"
                                }}/>
                            }
                        </Grid>
                    }
                    <Grid item xs={displayedTeam && !match.winner ? 5 : 4} sx={{mt: "2px"}}>
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
                    <Grid item xs={displayedTeam ? 5 : 6} sx={{height: "100%"}}>
                        <Divider sx={{pt: 2, pb: 3, m: 0, mr: 2, display: "inline"}} orientation="vertical"
                                 variant="middle"/>
                        {displayedTeamName &&
                            <Link to={`/tournament/${tournamentId}/tab/2/team/${match.teamA}`}>
                                <Typography variant="h6" sx={{verticalAlign: "middle"}} display="inline">
                                    {!displayedTeam && match.winner === match.teamA &&
                                        <EmojiEventsIcon sx={{
                                            mr: 1,
                                            mb: "3px",
                                            height: '100%',
                                            verticalAlign: "middle",
                                            color: "#07c6b6"
                                        }}/>
                                    }
                                    {!displayedTeam && match.winner === match.teamB &&
                                        <CancelIcon sx={{
                                            mr: 1,
                                            mb: "3px",
                                            height: '100%',
                                            verticalAlign: "middle",
                                            color: "#e64b4b"
                                        }}/>
                                    }
                                    <b>{displayedTeamName}</b>
                                </Typography>
                            </Link>
                        }
                        <Typography sx={{verticalAlign: "middle", ml: (displayedTeamName ? 1 : 0), mr: 1}}
                                    display="inline">
                            <span className="blueWord">vs</span>
                        </Typography>

                        <Link
                            to={`/tournament/${tournamentId}/tab/2/team/${!teamId || teamId === match.teamA ? match.teamB : match.teamA}`}>
                            <Typography variant="h6" sx={{verticalAlign: "middle"}} display="inline">
                                <b>{otherTeamName}</b>
                                {!displayedTeam && match.winner === match.teamB &&
                                    <EmojiEventsIcon sx={{
                                        ml: 1,
                                        mb: "3px",
                                        height: '100%',
                                        verticalAlign: "middle",
                                        color: "#07c6b6"
                                    }}/>
                                }
                                {!displayedTeam && match.winner === match.teamA &&
                                    <CancelIcon sx={{
                                        ml: 1,
                                        mb: "3px",
                                        height: '100%',
                                        verticalAlign: "middle",
                                        color: "#e64b4b"
                                    }}/>
                                }
                            </Typography>
                        </Link>
                    </Grid>
                    <Grid item xs={2}>
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