import { fetch } from '../services/http';
import AppConfig from '../../config/appConfig';

export const DEBUG_START = 'DEBUG_START';
export const DEBUG_STOP = 'DEBUG_STOP';

/**
 * Replay actions dispatcher
 * @param  {Object} response - API response
 * @param  {Function} dispatch - Redux dispatch function
 */
const replayActions = (response, dispatch) => {
    dispatch({
        debug: true,
        type: DEBUG_START,
    });

    const actions = response.session;

    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];

        setTimeout(() => {
            console.log('Dispatching action:', action); // eslint-disable-line

            dispatch({
                debug: true,
                ...action,
            });

            if (i === actions.length) {
                dispatch({
                    debug: true,
                    type: DEBUG_STOP,
                });
            }
        }, i * 2000);
    }
};

export const FETCH_USER_ACTIONS = 'FETCH_USER_ACTIONS';

/**
* Replay session action creator
 * @param  {string} sessionId - session ID
 * @return {Object} Action with type, promise and custom "onSuccess" handler
 */
export const replaySession = (sessionId) => {
    const promise = fetch(`${AppConfig.ACTION_LOG_ENDPOINT}/${sessionId}`);

    return {
        debug: true,
        type: FETCH_USER_ACTIONS,
        promise,
        onSuccess: replayActions,
    };
};
