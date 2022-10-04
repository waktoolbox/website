import {Box, Button, Modal, Stack, TextField} from "@mui/material";
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
                                 remove = true
                             }: { userData: UserData, setUserData: (_: UserData | undefined) => any, remove?: boolean }) {
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
                data.verified = true;
                setUserData(localUserData)
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
        <Stack direction="row">
            <TextField id="username" label={t("discord.pseudo")} value={localUserData.username}
                       disabled={localUserData.locked} onChange={handleChange}/>
            <TextField id="discriminator" label={t("discord.discriminator")} value={localUserData.discriminator}
                       onChange={handleChange} disabled/>

            {localUserData.verified &&
                <CheckCircleIcon/>
            }
            {!localUserData.verified &&
                <RadioButtonUncheckedIcon/>
            }
            <Button onClick={verifyPlayer}>{t('verify')}</Button>
            {!localUserData.locked && remove &&
                <Button onClick={removePlayer}><DeleteIcon/></Button>
            }

            <Modal open={discriminators.length > 0}>
                <Box sx={{
                    position: 'absolute' as 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
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
        </Stack>
    )
}