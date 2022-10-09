import {AppBar, Box, Button, Container, Divider, Grid, IconButton, Stack, Toolbar} from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import PersonIconOutlined from '@mui/icons-material/PersonOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import LanguagePicker from "./language-picker";
import {useTranslation} from "react-i18next";
import {Link, useNavigate} from "react-router-dom";
import React, {KeyboardEvent, MouseEvent, useContext, useEffect, useState} from "react";
import {UserContext} from "../context/user-context";
import {SocketContext} from "../context/socket-context";

export default function Menu() {
    const [state, setState] = useState({
        open: false
    });

    const userContext = useContext(UserContext);
    const socket = useContext(SocketContext);
    const navigate = useNavigate();
    const {t} = useTranslation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !userContext?.userState?.connected) {
            socket.emit('authenticate', token, (connected: boolean) => {
                userContext.dispatch({type: "setConnected", payload: connected});
            });
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const disconnect = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('discordId');
        userContext.dispatch({type: "setConnected", payload: false});
        socket.disconnect();
        navigate('/');
    }


    const toggleDrawer =
        (open: boolean) =>
            (event: KeyboardEvent | MouseEvent) => {
                if (
                    event && event.type === 'keydown' &&
                    ((event as KeyboardEvent).key === 'Tab' ||
                        (event as KeyboardEvent).key === 'Shift')
                ) {
                    return;
                }

                setState({open: open});
            };

    return (
        <Box sx={{flexGrow: 1}}>
            <SwipeableDrawer
                anchor="left"
                open={state['open']}
                onClose={toggleDrawer(false)}
                onOpen={toggleDrawer(true)}
            >
                <Box
                    sx={{width: 250}}
                    role="presentation"
                    onClick={toggleDrawer(false)}
                    onKeyDown={toggleDrawer(false)}
                >
                    <img style={{padding: "40px 20px 5px 30px"}} src={`/logo.png`} alt={'logo'}/>
                    <Divider sx={{ml: '30px', mr: '60px', mb: '50px'}} variant="middle" flexItem/>
                    <List>
                        <ListItem key="participations">
                            <Stack>
                                <ListItemText primary={t('holdings')}/>
                                <List>
                                    <ListItem key="participations.myTeams"
                                              sx={{color: '#9da5a8', '&:hover': {color: '#10e9d6'}}}>
                                        <ListItemText primary={t('coming.soon')}/>
                                    </ListItem>
                                </List>
                            </Stack>
                        </ListItem>

                        <ListItem key="tournament.tools">
                            <Stack>
                                <ListItemText primary={t('tournament.tools')}/>
                                <List>
                                    <ListItem key="participations.myTeams"
                                              sx={{color: '#9da5a8', '&:hover': {color: '#10e9d6'}}}>
                                        {/*TODO later setup tournament creation*/}
                                        <ListItemText primary={t('tournament.create') + " - " + t('coming.soon')}/>
                                    </ListItem>
                                </List>
                            </Stack>
                        </ListItem>

                        <ListItem key="account">
                            <Link to="/account" hidden={!userContext.userState.connected}>
                                <ListItemText primary={t('account.menuItem')}
                                              sx={{color: '#9da5a8', '&:hover': {color: '#10e9d6'}}}/>
                            </Link>
                        </ListItem>
                    </List>
                    {/*<Divider/>*/}
                </Box>
            </SwipeableDrawer>

            <AppBar position="static" sx={{boxShadow: 3}}>
                <Container maxWidth="xl">
                    <Toolbar variant="dense" disableGutters>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{mr: 2}}
                            onClick={toggleDrawer(true)}
                        >
                            <MenuIcon/>
                        </IconButton>
                        <div style={{flexGrow: 1, justifyContent: 'center', alignItems: 'center', marginTop: '8px'}}>
                            <Link to="/">
                                <img src={`/logo.png`} alt={'logo'}/>
                            </Link>
                        </div>

                        <Grid container justifyContent="flex-end">
                            {!userContext.userState.connected &&
                                <a href={process.env.REACT_APP_DISCORD_OAUTH_URL}>
                                    <Button sx={{
                                        borderColor: '#00ead1 !important',
                                        color: '#fefffa',
                                        backgroundColor: '#213a41'
                                    }} variant="outlined">
                                        <PersonIcon sx={{ml: -1, mr: 1, color: '#07c6b6'}}/>
                                        {t('connect')}
                                    </Button>
                                </a>
                            }
                            {userContext.userState.connected &&
                                <Button sx={{
                                    borderColor: '#00ead1 !important',
                                    color: '#fefffa',
                                    backgroundColor: '#213a41'
                                }} variant="outlined" onClick={disconnect}>
                                    <PersonIconOutlined sx={{ml: -1, mr: 1, color: '#07c6b6'}}/>
                                    {t('disconnect')}
                                </Button>
                            }
                            <Divider sx={{ml: 1, mr: 1}} orientation="vertical" variant="middle" flexItem/>
                            <LanguagePicker/>
                        </Grid>

                    </Toolbar>
                </Container>
            </AppBar>
        </Box>
    );
}