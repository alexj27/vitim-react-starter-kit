// import faker from 'faker';
import * as actionTypes from '../actions';
import { toCamelCaseObject } from '../../helpers/utils';


const initialState = {
    user: {
        theme: {
            headerBackground: 'http://lorempixel.com/1600/200/',
        }
    },
    logged: false,
    requestId: null,
};


export default function auth(state = initialState, action) {
    switch (action.type) {
        case actionTypes.succeeded(actionTypes.SET_AUTH_USER): {
            const user = action.result.data;
            return {
                ...state,
                logged: true,
                fbUser: action.fbUser,
                requestId: action.result.request_id,
                user: {
                    ...toCamelCaseObject(user),
                    slug: user.user_id,
                },
            };
        }
        case actionTypes.succeeded(actionTypes.UPDATE_PROFILE):
            return {
                ...state,
                user: {
                    ...state.user,
                    ...toCamelCaseObject(action.data),
                },
            };
        case actionTypes.LOGOUT:
            return {
                ...state,
                logged: false,
            };
        case actionTypes.SET_AUTH_ERROR:
            return {
                ...state,
                logged: false,
                error: action.error,
            };
        default:
            return state;
    }
}
