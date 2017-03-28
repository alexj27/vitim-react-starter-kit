export const SIG_REGISTRATION = 'SIG_REGISTRATION';
export function sigRegistration(selfId) {
    return {
        type: SIG_REGISTRATION,
        selfId,
    };
}


export const SIG_EXCHANGE = 'SIG_EXCHANGE';
export function sigExchange(to, data) {
    return {
        type: SIG_EXCHANGE,
        to,
        ...data,
    };
}


export const SIG_USER_REGISTERED = 'SIG_USER_REGISTERED';
export const SIG_SET_REGISTERED_USERS = 'SIG_SET_REGISTERED_USERS';
export function sigLoadRegisteredUsers(status) {
    return {
        type: SIG_SET_REGISTERED_USERS,
        status,
    };
}


export const SIG_USER_DISCONNECTED = 'SIG_USER_DISCONNECTED';
export function sigUserOffline(userId) {
    return {
        type: SIG_USER_DISCONNECTED,
        userId
    };
}

export const WS_CONNECTED = 'WS_CONNECTED';
export function sigConnected() {
    return {
        type: WS_CONNECTED
    };
}

export const WS_DISCONNECTED = 'WS_DISCONNECTED';
export function sigNoConnection() {
    return {
        type: WS_DISCONNECTED
    };
}

export const WS_ERROR = 'WS_ERROR';
export function wsError(error) {
    return {
        type: WS_ERROR,
        error,
    };
}


export const SIG_CALL = 'SIG_CALL';
export const SIG_CALL_OFFER = 'SIG_CALL_OFFER';

export function call(userId) {
    return {
        type: SIG_CALL,
        userId
    };
}


export const SIG_CALL_ACCEPTED = 'SIG_CALL_ACCEPTED';
export function callAccept(userId) {
    return {
        type: SIG_CALL_ACCEPTED,
        userId
    };
}


export const SIG_CALL_REJECTED = 'SIG_CALL_REJECTED';
export function callReject(userId) {
    return {
        type: SIG_CALL_REJECTED,
        userId
    };
}


export const SIG_HUNG_UP = 'SIG_HUNG_UP';
export function sigHungUp(userId) {
    return {
        type: SIG_HUNG_UP,
        userId
    };
}
