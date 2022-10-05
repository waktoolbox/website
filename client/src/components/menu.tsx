import {AppBar, Box, Button, Container, IconButton, Toolbar, Typography} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import {AdUnitsTwoTone} from "@mui/icons-material";
import ListItemText from "@mui/material/ListItemText";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import LanguagePicker from "./language-picker";
import {useTranslation} from "react-i18next";
import {Link, useNavigate} from "react-router-dom";
import {KeyboardEvent, MouseEvent, useContext, useEffect, useState} from "react";
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
                    <Typography variant={"h3"}>{t('tournament.title')}</Typography>
                    <List>
                        <Link to={"edit-tournament"}>
                            <ListItem key="tournament.create">
                                <ListItemButton>
                                    <ListItemIcon>
                                        <AdUnitsTwoTone/>
                                    </ListItemIcon>
                                    <ListItemText primary={t('tournament.create')}/>
                                </ListItemButton>
                            </ListItem>
                        </Link>
                    </List>
                    {/*<Divider/>*/}
                </Box>
            </SwipeableDrawer>

            <AppBar position="static">
                <Container maxWidth="xl" sx={{pr: 1}}>
                    <Toolbar disableGutters sx={{justifyContent: 'space-between'}}>
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
                        <Link to="/">
                            <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                                Waktool
                            </Typography>
                        </Link>
                        {!userContext.userState.connected &&
                            <Link to="/login">
                                <Button color="inherit">{t('connect')}</Button>
                            </Link>
                        }
                        {userContext.userState.connected &&
                            <Button color="inherit" onClick={disconnect}>{t('disconnect')}</Button>
                        }
                        <div/>
                        <Box sx={{justifyContent: "flex-end"}}>
                            <LanguagePicker/>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>
        </Box>
    );
}