import {createContext, Dispatch, ReactElement, ReactNode, useReducer} from 'react';

export interface UserData {
    connected: boolean;
}

const defaultUserData: UserData = {
    connected: false
}

export type ActionType = {
    type: string,
    payload?: any
};

export type ContextType = {
    userState: UserData;
    dispatch: Dispatch<ActionType>;
};

const Reducer = (state: UserData, action: ActionType): any => {
    switch (action.type) {
        case 'setConnected':
            return {
                ...state,
                connected: action.payload
            };

        default:
            return state;
    }
}

export const UserContext = createContext({} as ContextType)

export function UserContextProvider({children}: { children: ReactNode }): ReactElement {
    const [userState, dispatch] = useReducer(Reducer, defaultUserData);

    return <UserContext.Provider value={{userState, dispatch}}>{children}</UserContext.Provider>;
}