import _ from 'lodash';
import appConfig from '../../config/appConfig';


export const SET_REACHERS = 'SET_REACHERS';

export function loadReachers(category, query, size = appConfig.DEFAULT_PAGE_SIZE) {
    return {
        requestParams: {
            ep: `${appConfig.RIVER_EP}/${query ? 'search' : (category || 'featured')}`,
            data: {
                query,
                size,
            },
            method: 'get',
        },
        type: SET_REACHERS,
    };
}


export const PUSH_REACHERS = 'PUSH_REACHERS';
export function loadMoreReachers(category, query, size = appConfig.DEFAULT_PAGE_SIZE) {
    return (dispatch, getState) => {
        const { reachers: { cursorId, items } } = getState();

        return dispatch({
            type: PUSH_REACHERS,
            requestParams: {
                ep: `${appConfig.RIVER_EP}/${query ? 'search' : (category || 'featured')}`,
                data: {
                    query,
                    from: items.length,
                    size,
                    cursor_id: cursorId,
                },
                method: 'get',
            },
        });
    };
}


export const UPDATE_PROFILE = 'UPDATE_PROFILE';

export function updateProfile(userId, data) {
    const picks = ['user_id', 'name', 'description', 'url', 'image', 'twitter', 'facebook', 'website', 'curtain'];

    return {
        userId,
        data: { ...data, slug: data.slug || (data.route || data.userId || '').replace('/', '') },
        type: UPDATE_PROFILE,
        requestParams: {
            ep: `${appConfig.USER_EP}/${userId}/profile/update`,
            data: {
                ..._.pick(data, picks),
                user_id: userId,
            },
            method: 'put',
        },
    };
}

export const SET_PROFILE_PICTURE = 'SET_PROFILE_PICTURE';

export function setProfilePicture(user, original, thumb) {
    return {
        original,
        thumb,
        user,
        userId: user.userId,
        type: SET_PROFILE_PICTURE,
    };
}


export const TOGGLE_SUBSCRIPTION = 'TOGGLE_SUBSCRIPTION';

export function toggleSubscription(myId, reacherId, status) {
    const data = {
        user_id: myId,
        reacher_user_id: reacherId,
        toggle: status,
    };
    return {
        requestParams: {
            ep: `${appConfig.USER_EP}/${myId}/reacher/${reacherId}/subscribe/${status.toString()}`,
            data,
            method: 'put',
        },
        myId,
        reacherId,
        status,
        type: TOGGLE_SUBSCRIPTION,
    };
}


export const SET_SUBSCRIPTIONS = 'SET_SUBSCRIPTIONS';

export function loadSubscriptions(myId) {
    return {
        requestParams: {
            ep: `${appConfig.USER_EP}/${myId}/subscriptions`,
            method: 'get',
        },
        myId,
        type: SET_SUBSCRIPTIONS,
    };
}


export const SET_PROFILE = 'SET_PROFILE';

export function loadProfile(userId) {
    return {
        userId,
        requestParams: {
            ep: `${appConfig.USER_EP}/${userId}/profile`,
            method: 'get',
        },
        type: SET_PROFILE,
    };
}


export const TOGGLE_REACHER = 'TOGGLE_REACHER';

export function toggleReacher(userId, status) {
    return {
        userId,
        status,
        requestParams: status ? {
            ep: `${appConfig.REACHER_EP}/${userId}/onboard`,
            method: 'post',
            data: {},
        } : null,
        type: TOGGLE_REACHER,
        onTriggered: (dispatch) => {
            return dispatch({ userId, status, type: TOGGLE_REACHER });
        }
    };
}
