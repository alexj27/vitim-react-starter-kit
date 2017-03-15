import endpoints from './endpoints';

const env = process.env.NODE_ENV || 'development';

const config = {
    development: require('./environments/development').default,
    production: require('./environments/production').default,
};

export default {
    ...config[env],
    ...endpoints(config[env]),
};
