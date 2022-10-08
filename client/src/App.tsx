import React from 'react';
import './App.css';
import {socket, SocketContext} from "./context/socket-context";
import {UserContextProvider} from "./context/user-context";
import {Home} from "./Home";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import {Typography} from "@mui/material";
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

            <footer>
                <Typography
                    sx={{mt: 2, backgroundColor: "#152429", fontSize: '0.8rem'}}>{t('waktool.wakfu')}</Typography>
            </footer>
        </div>
    );
}

export default App;
