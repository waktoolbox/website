import * as React from 'react';
import {AppBar, Box, Button, IconButton, Toolbar, Typography} from "@mui/material";
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
import {Link} from "react-router-dom";

export default function Menu() {
    const [state, setState] = React.useState({
        open: false
    });

    const {t} = useTranslation();

    const toggleDrawer =
        (open: boolean) =>
            (event: React.KeyboardEvent | React.MouseEvent) => {
                if (
                    event && event.type === 'keydown' &&
                    ((event as React.KeyboardEvent).key === 'Tab' ||
                        (event as React.KeyboardEvent).key === 'Shift')
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
                        <Link to={"create-tournament"}>
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
                <Toolbar>
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
                    <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                        Waktool
                    </Typography>
                    <Link to="/login">
                        <Button color="inherit">{t('connect')}</Button>
                    </Link>
                    <LanguagePicker/>
                </Toolbar>
            </AppBar>
        </Box>
    );
}