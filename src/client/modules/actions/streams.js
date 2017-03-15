import appConfig from '../../config/appConfig';


export const SET_ARCHIVED_STREAMS = 'SET_ARCHIVED_STREAMS';
export const SET_STREAMS = 'SET_STREAMS';

export function loadStreams(userId) {
    return {
        type: SET_STREAMS,
        userId
    };
}


export const SET_STREAM = 'SET_STREAM';
export function createStream(userId, values) {

    return {
        type: SET_STREAM,
        userId,
        requestParams: {
            ep: `${appConfig.REACHER_EP}/${userId}/stream/create`,
            data: values,
            method: 'post',
        },
        data: values,
    };
}


export const CREATE_STREAM_WITH_IMAGE = 'CREATE_STREAM_WITH_IMAGE';
export function createStreamWithImage(userId, values) {
    return {
        type: CREATE_STREAM_WITH_IMAGE,
        userId,
        values,
    };
}


export const UPDATE_STREAM = 'UPDATE_STREAM';
export function updateStream(userId, streamId, values) {
    return {
        type: UPDATE_STREAM,
        data: values,
        streamId,
        userId,
        requestParams: {
            ep: `${appConfig.REACHER_EP}/${userId}/stream/${streamId}/update`,
            data: values,
            method: 'put',
        },
    };
}


export const UPDATE_STREAM_WITH_IMAGE = 'UPDATE_STREAM_WITH_IMAGE';
export function updateStreamWithImage(userId, streamId, values, prevImage) {
    return {
        type: UPDATE_STREAM_WITH_IMAGE,
        userId,
        streamId,
        values,
        prevImage,
    };
}


export const RECORD_STREAM = 'RECORD_STREAM';
export function recordStream(userId, streamId) {
    return {
        type: RECORD_STREAM,
        requestParams: {
            ep: `${appConfig.REACHER_EP}/${userId}/stream/${streamId}/record`,
            data: { userId, streamId },
            method: 'put',
        },
    };
}


export const PLAY_STREAM = 'PLAY_STREAM';
export function playStream(userId, streamId) {
    return {
        type: PLAY_STREAM,
        userId,
        streamId,
    };
}
