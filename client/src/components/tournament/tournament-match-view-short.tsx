import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CancelIcon from '@mui/icons-material/Cancel';
import {TournamentMatchModel} from "../../utils/tournament-models";
import {Button, Card, CardContent, Grid, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import React from "react";

const dateFormat = {
    date: {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: 'numeric', timeZoneName: 'short'
    }
}

export default function TournamentTeamMatchViewShort({
                                                         match,
                                                         teamAName,
                                                         teamAQualification,
                                                         teamBName,
                                                         teamBQualification,
                                                         goToMatch,
                                                         backgroundColor = "#162329"
                                                     }: { match: TournamentMatchModel, teamAName?: string, teamAQualification?: string, teamBName: string, teamBQualification?: string, goToMatch: any, backgroundColor?: string }) {
    const {t} = useTranslation();

    return (
        <Card sx={{
            mt: 3, mr: 1, mb: 3,
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
                    <Grid item xs={12} sx={{mt: "2px"}}>
                        <Typography variant="h6" sx={{
                            textAlign: "start",
                            verticalAlign: "middle",
                            color: match.winner === match.teamA ? '#07c6b6' : "#e64b4b"
                        }}>
                            {match.winner === match.teamA &&
                                <EmojiEventsIcon sx={{
                                    mr: 1,
                                    mb: "3px",
                                    height: '100%',
                                    verticalAlign: "middle"
                                }}/>
                            }
                            {match.winner === match.teamB &&
                                <CancelIcon sx={{
                                    mr: 1,
                                    mb: "3px",
                                    height: '100%',
                                    verticalAlign: "middle"
                                }}/>
                            }
                            <b>{teamAName}{teamAQualification ? " " + teamAQualification : ""}</b>
                        </Typography>
                        <Typography variant="h6" sx={{
                            textAlign: "start",
                            verticalAlign: "middle",
                            color: match.winner === match.teamB ? '#07c6b6' : "#e64b4b"
                        }}>
                            {match.winner === match.teamB &&
                                <EmojiEventsIcon sx={{
                                    mr: 1,
                                    mb: "3px",
                                    height: '100%',
                                    verticalAlign: "middle"
                                }}/>
                            }
                            {match.winner === match.teamA &&
                                <CancelIcon sx={{
                                    mr: 1,
                                    mb: "3px",
                                    height: '100%',
                                    verticalAlign: "middle"
                                }}/>
                            }
                            <b>{teamBName}{teamBQualification ? " " + teamBQualification : ""}</b>
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sx={{mt: 1}}>
                        <Typography sx={{textAlign: "center"}}>
                            <b>{!match.date ? t('tournament.display.match.noDate') : t('date', {
                                date: Date.parse(match.date),
                                formatParams: dateFormat
                            })}</b>
                        </Typography>
                        <Typography sx={{color: "#848889", whiteSpace: "pre-line", textAlign: "center"}}>
                            {match.rounds && match.rounds.map((r, i) => `${i + 1}. ` + t(`maps.${r.map}`) + "\n")}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sx={{mt: 1}} textAlign="center">
                        <Button onClick={goToMatch}>
                            {t('tournament.display.match.more')}
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}