export default (config) => {
    return {
        RIVER_EP: `${config.BASE_URL}/api/v1/river`,
        USER_EP: `${config.BASE_URL}/api/v1/user`,
        REACHER_EP: `${config.BASE_URL}/api/v1/reacher`,
        LOGIN_EP: `${config.BASE_URL}/api/v1/user/login`,
        PURCHASE_EP: `${config.BASE_URL}/api/v1.0/stream/purchase`
    };
};
