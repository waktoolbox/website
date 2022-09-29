import * as React from 'react';
import {SyntheticEvent, useContext, useEffect, useState} from 'react';
import Snackbar from '@mui/material/Snackbar';
import {SocketContext} from "../context/socket-context";
import {useTranslation} from "react-i18next";
import {Alert, AlertColor} from "@mui/material";

export default function MySnackbar() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState();
    const [severity, setSeverity] = useState("info");
    const socket = useContext(SocketContext);
    const {t} = useTranslation();

    useEffect(() => {
        function pop(k: string, s: string) {
            setMessage(t(k));
            setSeverity(s);
            setOpen(true);
        }

        socket.on('error', key => {
            pop(key, "error");
        });

        socket.on('info', key => {
            pop(key, "info");
        });

        socket.on('warning', key => {
            pop(key, "warning");
        });

        socket.on('success', key => {
            pop(key, "success");
        });

        return () => {
            socket.off('error');
            socket.off('info');
            socket.off('warning');
            socket.off('success');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleClose = (event: SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;

        setOpen(false);
    };

    return (
        <div>
            <Snackbar
                open={open}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{vertical: "top", horizontal: "right"}}
            >
                <Alert severity={severity as AlertColor} onClose={handleClose}>{message}</Alert>
            </Snackbar>
        </div>
    );
}
