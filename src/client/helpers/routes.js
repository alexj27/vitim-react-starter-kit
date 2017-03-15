import * as actions from '../modules/actions';


/**
 * @param  {object} store Redux store
 * @return {function} onEnter callback helper for check authenticated user
 */
export function authRequired(store) {
    return (nextState, replace) => {
        const state = store.getState();
        if (!state.auth.logged) {
            replace('/login');
        }
    };
}

/**
 * @param  {object} store Redux store
 * @return {function} onEnter callback helper for check not authenticated user
 */
export function authNoRequired(store) {
    return (nextState, replace) => {
        const state = store.getState();
        if (state.auth.logged) {
            replace(`/profile/${state.auth.user.slug}`);
        }
    };
}


/**
 * @param  {object} store Redux store
 * @return {function} onEnter callback helper for user logout
 */
export function authLogout(store) {
    return (nextState, replace, next) => {
        store.dispatch(actions.logout()).then(() => {
            replace('/');
            next();
        });
    };
}


/**
 * @param  {object} store Redux store
 * @return {function} onEnter callback helper for user logout
 */
export function checkAuth(store) {
    return (nextState, replace, next) => {
        const { api: { firebaseInited } } = store.getState();

        if (!firebaseInited) {
            const result = store.dispatch(actions.checkFirebaseAuth());
            if (result.then !== undefined) {
                return result.then(() => next());
            }
        }
        return next();
    };
}


export function openFacebookTL(location) {
    return ({
        ...location,
        query: {
            ...location.query,
            timeLine: 'facebook',
        },
    });
}


export function openTwitterTL(location) {
    return ({
        ...location,
        query: {
            ...location.query,
            timeLine: 'twitter',
        },
    });
}
