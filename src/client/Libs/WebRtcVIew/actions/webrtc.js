
export const WEBRTC_CAMERA_CAPTURED = 'WEBRTC_CAMERA_CAPTURED';
export function webRtcCameraCaptured(selfViewSrc) {
    return {
        type: WEBRTC_CAMERA_CAPTURED,
        selfViewSrc
    };
}
