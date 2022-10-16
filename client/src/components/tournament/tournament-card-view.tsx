import {Box, Card, CardContent, CardMedia, Typography} from "@mui/material";
import {Link} from "react-router-dom";
import {TournamentDefinition} from "../../utils/tournament-models";
import {useTranslation} from "react-i18next";

type TournamentViewProps = {
    tournament: TournamentDefinition
    height: number
    width: number
    logoHeight: number,
    overriddenLink?: string,
    overriddenLevelAndServer?: number,
    overriddenLevelAndServerMt?: number
}

export default function TournamentCardView(props: TournamentViewProps) {
    const {
        tournament,
        height,
        width,
        logoHeight,
        overriddenLink,
        overriddenLevelAndServer,
        overriddenLevelAndServerMt
    } = props;
    const {t} = useTranslation();
    return (
        <Link to={overriddenLink || `/tournament/${tournament.id}`}>
            <Card sx={{
                mr: "auto",
                ml: "auto",
                height: `${height}px`,
                width: `${width}px`,
                backgroundColor: "#152429",
                borderRadius: "8px",
                boxShadow: "5px 5px 15px -2px #000000"
            }}>
                <CardMedia component="img" height={logoHeight}
                           image={tournament.logo} sx={{zIndex: 1000}}/>
                <CardContent>
                    <Box sx={{
                        position: "relative",
                        ml: "auto",
                        mr: "auto",
                        mt: overriddenLevelAndServerMt || -5,
                        mb: 2,
                        zIndex: 1001,
                        borderRadius: 3,
                        backgroundColor: "#017d7f",
                        width: "fit-content",
                        height: `${overriddenLevelAndServer || "50"}px`,
                        pl: 2,
                        pr: 2,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center"
                    }}>
                        <Typography><b>{t('tournament.display.levelAndServer', {
                            level: tournament.level,
                            server: tournament.server
                        })}</b></Typography>
                    </Box>

                    <Typography sx={{textAlign: "left", ml: 2}} variant="h6"><b>{tournament.name}</b></Typography>
                    <Typography sx={{
                        textAlign: "left",
                        ml: 2
                    }}>{t('tournament.fromTo', {
                        from: new Date(Date.parse((tournament as any).startdate)),
                        to: new Date(Date.parse((tournament as any).enddate))
                    })}</Typography>
                </CardContent>
            </Card>
        </Link>
    )
}