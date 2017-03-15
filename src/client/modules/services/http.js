import axios from 'axios';
import { SubmissionError } from 'redux-form';
// import Cookies from 'js-cookie';
import config from '../../config/appConfig';


export function makeApiInstance(baseURL) {
    const headers = {
        'X-Requested-With': 'XMLHttpRequest',
    };

    return Promise.resolve(
        axios.create({
            baseURL,
            headers
        })
    );
}


export const get = (url, values) => {
    return makeApiInstance(config.HOST, null).then((instance) => {
        return instance.get(url, { params: values });
    }).then((res) => {
        return res.data;
    }).catch((err) => {
        console.error('GET exception', err);
        throw err;
    });
};


export const submit = (url, values) => {
    return makeApiInstance(config.HOST).then((instance) => {
        return instance.post(url, values);
    }).then((res) => {
        if (res && [200, 201].indexOf(res.status) > -1) {
            return res.data;
        }
        return null;
    }).catch((error) => {
        if (error.response && [400, 401, 409].indexOf(error.response.status) > -1) {
            throw new SubmissionError(Object.assign({},
                error.response.data,
                { status: error.response.status }));
        } else {
            throw error;
        }
    });
};


export const update = (url, values) => {
    return makeApiInstance(config.HOST).then((instance) => {
        return instance.put(url, values);
    }).then((res) => {
        if (res && [200, 201].indexOf(res.status) > -1) {
            return res.data;
        }
        return null;
    }).catch(({ response }) => {
        if (response && [400, 401, 409].indexOf(response.status) > -1) {
            throw new SubmissionError(Object.assign({},
                response.data,
                { httpStatus: response.status }));
        } else {
            console.error(response);
            throw new Error(response.data.message);
        }
    });
};


export const deleteItem = (url) => {
    return makeApiInstance(config.HOST).then((instance) => {
        return instance.delete(url);
    }).catch(({ response }) => {
        if (response && [400, 401, 409].indexOf(response.status) > -1) {
            throw new SubmissionError(Object.assign({},
                response.data,
                { httpStatus: response.status }));
        } else {
            console.error(response);
            throw new Error(response.data.message);
        }
    });
};
