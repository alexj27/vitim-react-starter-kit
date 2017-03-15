import { triggered, succeeded, failed } from '../actions';
import { get, submit, update } from '../services/http';
// import { authFailed } from '../actions';


export default function promiseMiddleware({ dispatch, getState }) {
    return next => (action) => {
        const { requestParams, type, onTriggered, onSuccess, onFailure, analytics, ...rest } = action;
        if (!requestParams) {
            return next(action);
        }
        let request;

        switch (requestParams.method) {
            case 'get':
                request = get(requestParams.ep, requestParams.data);
                break;
            case 'post':
                request = submit(requestParams.ep, requestParams.data);
                break;
            case 'put':
                request = update(requestParams.ep, requestParams.data);
                break;
            case 'delete':
                request = update(requestParams.ep);
                break;
            default:
                throw new Error('Unknown promise');
        }

        if (onTriggered) {
            onTriggered(dispatch, getState, ...rest);
        } else {
            dispatch({
                type: triggered(type),
                ...rest,
            });
        }

        return request
            .then((result) => {
                if (onSuccess) {
                    return onSuccess({ result, dispatch, getState, type: succeeded(type), ...rest });
                } else {
                    return dispatch({
                        type: succeeded(type),
                        result,
                        ...(analytics ? {
                            analytics: analytics(result),
                        } : {}),
                        ...rest,
                    });
                }
            })
            .catch((error) => {
                if (typeof __DEV__ !== 'undefined' && __DEV__) {
                    console.error(error); //eslint-disable-line
                }

                if (onFailure) {
                    onFailure({ error, dispatch, getState, type: failed(type), ...rest });
                } else {
                    dispatch({
                        type: failed(type),
                        error: {
                            ...error.response,
                            statusCode: error.status,
                        },
                        ...rest,
                    });
                    // raise form errors
                    if (requestParams.method !== 'get') {
                        throw error;
                    }
                }
            });
    };
}
