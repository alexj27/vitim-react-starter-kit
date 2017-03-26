export * from './signals';
export * from './webrtc';


/**
 * Action "triggered" type creator
 * @param  {string} type - action type
 * @return {string} new action type
 */
export function triggered(type) {
    return `${type}_REQUEST_TRIGGERED`;
}

/**
 * Action "succeeded" type creator
 * @param  {string} type - action type
 * @return {string} new action type
 */
export function succeeded(type) {
    return `${type}_REQUEST_SUCCESS`;
}

/**
 * Action "failed" type creator
 * @param  {string} type - action type
 * @return {string} new action type
 */
export function failed(type) {
    return `${type}_REQUEST_FAILURE`;
}
