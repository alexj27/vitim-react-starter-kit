import Helmet from 'react-helmet';
import config from '../config';
import Html from '../templates/Html';
import getStore from '../../client/modules/store';


export default function reactMiddleware(req, res, next) {
    const React = require('react');
    const renderToString = require('react-dom/server').renderToString;
    const assets = {
        javascript: '/static/js/main.js',
        styles: '/static/css/main.css',
    };

    if (config.serverRendering === true) {
        const RouterContext = require('react-router').RouterContext;
        const Provider = require('react-redux').Provider;
        const match = require('react-router').match;
        const routes = require('../../client/routes').default;
        const trigger = require('redial').trigger;
        const store = getStore({}, true);

        match({ routes: routes(store), location: req.url }, (error, redirectLocation, renderProps) => {
            if (error) return res.status(500).send(error.message);
            if (redirectLocation) return res.redirect(302, redirectLocation.pathname + redirectLocation.search);
            if (!renderProps) return res.status(404).send('Not Found');

            const { components } = renderProps;

            const props = {
                path: renderProps.location.pathname,
                query: renderProps.location.query,
                params: renderProps.params,
                dispatch: store.dispatch,
                getState: store.getState,
                cookies: req.cookies,
            };

            // Wait for async data fetching to complete, then render
            return trigger('fetch', components, props)
                .then(() => {
                    const initialState = store.getState();

                    const content = renderToString(
                        <Provider store={store}>
                            <RouterContext {...renderProps} />
                        </Provider>
                    );
                    const head = Helmet.rewind();

                    const html = renderToString(
                        <Html {...{ assets, content, initialState, head }}>
                            {content}
                        </Html>
                    );

                    res.status(200).send(html);
                })
                .catch((err) => {
                    next(err);
                });
        });
    } else {
        const html = renderToString(
            <Html {...{ assets }} />
        );

        res.status(200).send(html);
    }
}
