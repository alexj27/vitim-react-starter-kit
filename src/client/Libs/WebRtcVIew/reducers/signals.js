import * as actionTypes from '../actions';


const initialState = {
    registered: null,
    connected: null,
    ring: 'off',
    caller: null,
    inCallFrom: null,
    exchangeData: null,
    error: null,
    users: [],
};


export default function signals(state = initialState, action) {
    switch (action.type) {
        case actionTypes.WS_CONNECTED: {
            return {
                ...state,
                connected: true,
                error: null,
            }
        }
        case actionTypes.WS_DISCONNECTED: {
            return {
                ...state,
                ring: 'off',
                connected: false,
                caller: null,
                inCallFrom: null,
                users: [],
            };
        }
        case actionTypes.WS_ERROR: {
            return {
                ...state,
                connected: false,
                error: action.error,
            }
        }
        case actionTypes.SIG_USER_REGISTERED: {
            return {
                ...state,
                users: [...state.users, action.userId]
            };
        }
        case actionTypes.SIG_SET_REGISTERED_USERS: {
            return {
                ...state,
                users: action.users
            };
        }
        case actionTypes.SIG_USER_DISCONNECTED: {
            return {
                ...state,
                users: state.users.filter(userId => userId !== action.userId)
            };
        }
        case actionTypes.succeeded(actionTypes.SIG_REGISTRATION): {
            return {
                ...state,
                registered: true,
            };
        }
        case actionTypes.failed(actionTypes.SIG_REGISTRATION): {
            return {
                ...state,
                registered: false,
                reason: action.reason,
            };
        }
        case actionTypes.SIG_CALL_OFFER: {
            return {
                ...state,
                inCallFrom: action.userId,
                ring: 'incoming',
            };
        }
        case actionTypes.SIG_CALL_ACCEPTED: {
            return {
                ...state,
                ring: 'up',
            };
        }
        case actionTypes.SIG_CALL_REJECTED: {
            return {
                ...state,
                ring: 'off',
            };
        }
        case actionTypes.triggered(actionTypes.SIG_CALL): {
            return {
                ...state,
                ring: 'outgoing',
            };
        }
        case actionTypes.succeeded(actionTypes.SIG_CALL): {
            return {
                ...state,
                caller: action.from,
                ring: 'up',
            };
        }
        case actionTypes.failed(actionTypes.SIG_CALL): {
            return {
                ...state,
                registered: true,
                connected: true,
            };
        }
        case actionTypes.SIG_EXCHANGE: {
            if (action.fromServer) {
                return {
                    ...state,
                    exchangeData: action,
                };
            }
            return state;
        }
        case actionTypes.SIG_HUNG_UP: {
            return {
                ...state,
                ring: 'off',
                caller: null,
                inCallFrom: null,
                exchangeData: null,
            };
        }
        default:
            return state;
    }
}
