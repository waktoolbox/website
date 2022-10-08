import React from 'react';
import './App.css';
import {socket, SocketContext} from "./context/socket-context";
import {UserContextProvider} from "./context/user-context";
import {Home} from "./Home";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import {Divider, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";

function App() {
    const {t} = useTranslation();
    // @ts-ignore
    const theme = createTheme({
        palette: {
            background: {
                default: '#213a41'
            },
            text: {
                primary: '#fefffa',
                disabled: '#848889'
            }
        },

        typography: {
            fontFamily: [
                '-apple-system',
                'BlinkMacSystemFont',
                'Arial',
                'sans-serif',
                '"Apple Color Emoji"',
                '"Segoe UI Emoji"',
                '"Segoe UI Symbol"',].join(',')
        },

        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: ({ownerState}) => ({
                        backgroundColor: '#213a41'
                    }),
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: ({ownerState}) => ({
                        backgroundColor: (ownerState.color !== "error" ? '#4a7cb1' : "#8B0000"),
                        color: '#fefffa'
                    }),
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: ({ownerState}) => ({
                        backgroundColor: '#1f333a'
                    }),
                },
            },
            MuiContainer: {
                styleOverrides: {
                    root: ({ownerState}) => ({
                        backgroundColor: '#213a41'
                    }),
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: ({ownerState}) => ({
                        backgroundColor: '#0d1518'
                    }),
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: ({ownerState}) => ({
                        borderColor: '#284e51'
                    }),
                },
            },

            MuiTextField: {
                styleOverrides: {
                    root: ({ownerState}) => ({
                        label: {
                            color: '#546b73'
                        }
                    }),
                },
            }
        }
    })

    return (
        <div className="App">
            <ThemeProvider theme={theme}>
                <UserContextProvider>
                    <SocketContext.Provider value={socket}>
                        <Home/>
                    </SocketContext.Provider>
                </UserContextProvider>
            </ThemeProvider>

            <footer style={{backgroundColor: "#0d1518"}}>
                <img style={{marginTop: 16}} src="/logo.png" alt="logo"/>
                <Divider sx={{width: "166px", bgcolor: "rgba(132,136,137,0.3)", margin: "8px auto 8px auto !important"}}
                         variant="middle"/>
                <Typography
                    sx={{color: "#368488", fontSize: '0.8rem'}}>{t('waktool.wakfu')}</Typography>
                <Typography
                    sx={{mb: '3px', fontSize: '0.8rem'}}>{t('waktool.login')}</Typography>
            </footer>
        </div>
    );
}

export default App;
