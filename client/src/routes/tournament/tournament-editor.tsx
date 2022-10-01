import {useParams} from "react-router-dom";
import {ChangeEvent, SyntheticEvent, useContext, useEffect, useState} from "react";
import {SocketContext} from "../../context/socket-context";
import Box from "@mui/material/Box";
import {Button, Tab, Tabs, TextField, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import {DateTimePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment";
import {TournamentDefinition} from "../../../../common/tournament/tournament-models";
import {validateTournamentDefinition} from "../../utils/tournament-validator";

export default function TournamentEditor() {
    const {id} = useParams();
    const socket = useContext(SocketContext)
    const {t} = useTranslation();

    const [tournament, setTournament] = useState<TournamentDefinition>();
    const [changes, setChanges] = useState<any>({})
    const [errors, setErrors] = useState<any>([])
    const [tab, setTab] = useState(0);

    useEffect(() => {
        if (id) {
            socket.emit('tournament::get', id, ((t: TournamentDefinition) => {
                setTournament(t);
            }));
        } else {
            setTournament({} as TournamentDefinition)
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleTabChange = (event: SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const handleTournamentChange = (event: ChangeEvent<HTMLInputElement>) => {
        setTournament({
            ...tournament,
            [event.target.id]: event.target.value
        } as TournamentDefinition)
        setChanges({
            ...changes,
            [event.target.id]: event.target.value
        });
        setErrors(validateTournamentDefinition({
            ...tournament,
            ...changes,
            [event.target.id]: event.target.value
        } as TournamentDefinition, Date.now()));
    }

    const handleTournamentDateChange = (field: string, newValue: number | null | undefined, ignored?: string | undefined) => {
        setTournament({
            ...tournament,
            [field]: newValue || undefined
        } as TournamentDefinition)
        setChanges({
            ...changes,
            [field]: newValue
        });
        setErrors(validateTournamentDefinition({
            ...tournament,
            ...changes,
            [field]: newValue
        } as TournamentDefinition, Date.now()));
    }

    const commitBaseInformationChange = () => {
        socket.emit("tournament::setBaseInformation", tournament?.id || undefined, {...tournament, ...changes}, (result: TournamentDefinition) => {
            if (result) {
                setChanges({});
                if (result.id) {
                    setTournament(result);
                }
            }
        });
    }

    return (
        <div>
            <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                <Tabs value={tab} onChange={handleTabChange} aria-label="basic tabs example">
                    <Tab label={t('tournament.editor.information.general')}/>
                    <Tab label={t('tournament.editor.information.phases')}/>
                    <Tab label={t('tournament.editor.information.users')}/>
                </Tabs>
            </Box>
            <div
                role="tabpanel"
                hidden={tab !== 0}
                id={`simple-tabpanel-0`}
                aria-labelledby={`simple-tab-0`}
            >
                {tab === 0 && (
                    <Box sx={{p: 3}}>
                        <TextField id="id" label={t('tournament.id')} value={tournament?.id} disabled
                                   onChange={handleTournamentChange}/>
                        <TextField id="name" label={t('tournament.name')} value={tournament?.name}
                                   onChange={handleTournamentChange}/>
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <DateTimePicker
                                label={t('tournament.startDate')}
                                value={tournament?.startDate}
                                onChange={(value, ignored) => handleTournamentDateChange("startDate", value, ignored)}
                                renderInput={(params) => <TextField {...params} />}
                            />
                            <DateTimePicker
                                label={t('tournament.endDate')}
                                value={tournament?.endDate}
                                onChange={(value, ignored) => handleTournamentDateChange("endDate", value, ignored)}
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </LocalizationProvider>
                        <TextField id="level" label={t('tournament.level')} value={tournament?.level} type="number"
                                   onChange={handleTournamentChange}/>
                        <TextField id="description" label={t('tournament.description')} value={tournament?.description}
                                   onChange={handleTournamentChange}/>
                        <TextField id="rewards" label={t('tournament.rewards')} value={tournament?.rewards}
                                   onChange={handleTournamentChange}/>
                        <TextField id="rules" label={t('tournament.rules')} value={tournament?.rules}
                                   onChange={handleTournamentChange}/>
                        <TextField id="teamNumber" label={t('tournament.teamNumber')} value={tournament?.teamNumber}
                                   type="number" onChange={handleTournamentChange}/>
                        <TextField id="teamSize" label={t('tournament.teamSize')} value={tournament?.teamSize}
                                   onChange={handleTournamentChange}/>

                        <Button variant="contained" color="success" onClick={commitBaseInformationChange}
                                disabled={Object.keys(changes).length <= 0 || (errors && errors.length > 0)}>{t('send')}</Button>

                        {
                            errors && errors.length > 0 && errors.map((error: string) => (
                                <p key={error}>{t(error)}</p>
                            ))
                        }
                    </Box>
                )}
            </div>
            <div
                role="tabpanel"
                hidden={tab !== 1}
                id={`simple-tabpanel-1`}
                aria-labelledby={`simple-tab-1`}
            >
                {tab === 1 && (
                    <Box sx={{p: 3}}>
                        <Typography>TODO phases</Typography>
                    </Box>
                )}
            </div>
            <div
                role="tabpanel"
                hidden={tab !== 2}
                id={`simple-tabpanel-2`}
                aria-labelledby={`simple-tab-2`}
            >
                {tab === 2 && (
                    <Box sx={{p: 3}}>
                        <Typography>TODO users</Typography>
                    </Box>
                )}
            </div>
        </div>
    )
}