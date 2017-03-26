import * as actionTypes from '../actions';


const initialState = {
    selfViewSrc: null,
    shares: {},
    streams: {},
};


export default function webrtc(state = initialState, action) {
    switch (action.type) {
        case actionTypes.WEBRTC_CAMERA_CAPTURED: {
            return {
                ...state,
                selfViewSrc: action.selfViewSrc,
            };
        }
        default:
            return state;
    }
}
