import {Button, Grid, TextField, Typography} from "@mui/material";
import React, {ChangeEvent, useContext, useEffect, useState} from "react";
import {UserContext} from "../context/user-context";
import {SocketContext} from "../context/socket-context";
import {useNavigate} from "react-router-dom";
import {Trans, useTranslation} from "react-i18next";

export default function Account() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const userContext = useContext(UserContext);
    const socket = useContext(SocketContext);

    const [ankamaName, setAnkamaName] = useState("");
    const [ankamaDiscriminator, setAnkamaDiscriminator] = useState("");
    const [twitchUrl, setTwitchUrl] = useState("");

    useEffect(() => {
        if (!userContext.userState.connected) {
            return navigate('/')
        }

        socket.emit('account::myAccount', (acc: any) => {
            setAnkamaName(acc.ankamaName);
            setAnkamaDiscriminator(acc.ankamaDiscriminator);
            setTwitchUrl(acc.twitchUrl);
        })
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        switch (event.target.id) {
            case "ankamaName":
                return setAnkamaName(event.target.value);
            case "ankamaDiscriminator":
                return setAnkamaDiscriminator(event.target.value);
            case "twitchUrl":
                return setTwitchUrl(event.target.value);
        }
    }

    const save = () => {
        socket.emit('account::updateMyAccount', ankamaName, ankamaDiscriminator, twitchUrl)
    }

    return (
        <Grid container>
            <Grid item xs={12} sx={{
                backgroundColor: '#162834',
                height: '150px',
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textTransform: "uppercase"
            }}>
                <Typography variant="h4"><Trans i18nKey="account.title"
                                                components={{span: <span className="blueWord"/>}}/></Typography>
            </Grid>

            <Grid item xs={12} md={8} sx={{margin: "auto", pt: 3}}>
                <Grid container>
                    <Grid item xs={12} md={8} sx={{p: 2}}>
                        <TextField sx={{width: "100%"}} id="ankamaName" label={t("account.ankamaName")}
                                   value={ankamaName} onChange={handleChange}/>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{p: 2}}>
                        <TextField sx={{width: "100%"}} id="ankamaDiscriminator"
                                   label={t("account.ankamaDiscriminator")} value={ankamaDiscriminator}
                                   onChange={handleChange}/>
                    </Grid>
                    <Grid item xs={12} sx={{p: 2}}>
                        <TextField sx={{width: "100%"}} id="twitchUrl" label={t("account.twitchUrl")} value={twitchUrl}
                                   onChange={handleChange}/>
                    </Grid>
                    <Grid item xs={12} sx={{p: 2, pt: 1}}>
                        <Button sx={{width: "100%"}} onClick={save}>{t('save')}</Button>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
}