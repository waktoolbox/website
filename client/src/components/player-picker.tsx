import {Box, Button, Grid, Modal, Stack, TextField} from "@mui/material";
import {ChangeEvent, useContext, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import {SocketContext} from "../context/socket-context";

type UserData = { id?: string, username?: string, discriminator?: string, locked: boolean, verified: boolean };

export function PlayerPicker({
                                 userData,
                                 setUserData,
                                 remove = true, disabled = false
                             }: { userData: UserData, setUserData: (_: UserData | undefined) => any, remove?: boolean, disabled?: boolean }) {
    const [localUserData, setLocalUserData] = useState({
        ...userData
    })
    const [discriminators, setDiscriminators] = useState<UserData[]>([])
    const {t} = useTranslation();
    const socket = useContext(SocketContext);

    useEffect(() => {
        setLocalUserData({
            ...userData
        })
    }, [userData])

    const verifyPlayer = () => {
        socket.emit('account::findByName', localUserData.username, (accounts: UserData[]) => {
            if (!accounts || accounts.length <= 0) return;
            if (accounts.length === 1) {
                const data = {...localUserData};
                data.id = accounts[0].id
                data.discriminator = accounts[0].discriminator
                data.verified = true;
                setUserData(data)
                return;
            }

            setDiscriminators(accounts);
        });

    }

    const removePlayer = () => {
        setUserData(undefined);
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setLocalUserData({
            ...localUserData,
            [event.target.id]: event.target.value
        })
    }

    const pickDiscriminator = (user: UserData) => {
        setUserData({
            ...user,
            verified: true
        });
        setLocalUserData({
            ...user,
            verified: true
        })
        setDiscriminators([]);
    }

    return (
        <Grid container>
            <Grid item xs={5}>
                <TextField id="username" label={t("discord.pseudo")} value={localUserData.username}
                           disabled={disabled || localUserData.locked} onChange={handleChange}/>
            </Grid>
            <Grid item xs={2}>
                <TextField id="discriminator" label={t("discord.discriminator")} value={localUserData.discriminator}
                           onChange={handleChange} disabled/>
            </Grid>
            <Grid item xs={2}>
                <Button sx={{ml: 1, height: "100%", backgroundColor: "#546b73"}} disabled={disabled}
                        onClick={verifyPlayer}>{t('verify')}</Button>
            </Grid>
            <Grid item xs={1}>
                {localUserData.verified &&
                    <CheckCircleIcon sx={{height: "100%", fontSize: 40, color: "#057b7f"}}/>
                }
                {!localUserData.verified &&
                    <RadioButtonUncheckedIcon sx={{height: "100%", fontSize: 40}}/>
                }
            </Grid>
            <Grid item xs={1} sx={{ml: 1}}>
                <Button sx={{
                    height: "100%", backgroundColor: "darkRed",
                    '&.Mui-disabled': {
                        backgroundColor: 'rgba(139,0,0,0.2)'
                    }
                }} disabled={disabled || localUserData.locked || !remove} color="error"
                        onClick={removePlayer}><DeleteIcon/></Button>
            </Grid>


            <Modal open={discriminators.length > 0}>
                <Box sx={{
                    position: 'absolute' as 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    border: '2px solid #000',
                    boxShadow: 24,
                    pt: 2,
                    px: 4,
                    pb: 3,
                }}>
                    <Stack direction="row">
                        {discriminators.map(d => (
                            <Button key={d.id} onClick={() => pickDiscriminator(d)}>#{d.discriminator}</Button>
                        ))}
                    </Stack>
                </Box>
            </Modal>
        </Grid>
    )
}