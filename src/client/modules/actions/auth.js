import appConfig from '../../config/appConfig';


export const AUTH_FAILED = 'AUTH_FAILED';
export function authFailed() {
    return {
        type: AUTH_FAILED,
    };
}

export const LOGIN = 'LOGIN';
export function login(values) {
    return {
        type: LOGIN,
        values
    };
}

export const LOGOUT = 'LOGOUT';
export function logout() {
    return {
        type: LOGOUT,
    };
}


export const SIGNUP = 'SIGNUP';
export function signUp(values) {
    return {
        type: SIGNUP,
        values
    };
}

export const SOCIAL_AUTH = 'SOCIAL_AUTH';
export function socialAuth(provider) {
    return {
        type: SOCIAL_AUTH,
        provider
    };
}

export const LINK_SOCIAL_AUTH = 'LINK_SOCIAL_AUTH';
export function linkSocialAuth(provider) {
    return {
        type: LINK_SOCIAL_AUTH,
        provider
    };
}

export const SET_AUTH_TOKEN = 'SET_USER_TOKEN';
export function setUserToken() {
    return {
        type: SET_AUTH_TOKEN,
    };
}

export const SET_AUTH_USER = 'SET_AUTH_USER';
export function setAuthUser(user) {
    return {
        type: SET_AUTH_USER,
        requestParams: {
            ep: appConfig.LOGIN_EP,
            data: { user_id: user.uid },
            method: 'post',
        },
        fbUser: user,
    };
}

export const SET_AUTH_ERROR = 'SET_AUTH_ERROR';
export function setAuthError(error) {
    return {
        type: SET_AUTH_ERROR,
        error
    };
}
