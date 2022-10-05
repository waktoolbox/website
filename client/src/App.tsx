import React from 'react';
import './App.css';
import {socket, SocketContext} from "./context/socket-context";
import {UserContextProvider} from "./context/user-context";
import {Home} from "./Home";
import {createTheme, ThemeProvider} from "@mui/material/styles";

function App() {
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

        components: {
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

            MuiSelect: {
                variants: [
                    {
                        props: {variant: 'languagePicker'},
                        style: {
                            padding: '0px'
                        }
                    }
                ]
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
        </div>
    );
}

export default App;
