const env = process.env.NODE_ENV || 'development';

const config = {
    development: require('./environments/development').default,
    staging: require('./environments/production').default,
    production: require('./environments/production').default,
};

export default {
    ...config[env],
};
