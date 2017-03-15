import appConfig from '../../config/appConfig';


export const CREATE_PAYMENT = 'CREATE_PAYMENT';
export const createPayment = (stream) => {
    return {
        stream,
        type: CREATE_PAYMENT,
        paypalParams: {
            ep: `${appConfig.USER_EP}/${stream.reacherUserId}/stream/${stream.streamId}/purchase`,
            method: 'post',
        },
    };
};


export const EXECUTE_PAYMENT = 'EXECUTE_PAYMENT';
export const executePayment = (stream, data) => {
    return {
        stream,
        data,
        type: EXECUTE_PAYMENT,
        paypalParams: {
            ep: `${appConfig.USER_EP}/${stream.reacherUserId}/stream/${stream.streamId}/purchase`,
            method: 'post',
        },
    };
};
