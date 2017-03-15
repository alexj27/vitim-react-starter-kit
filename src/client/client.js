import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, browserHistory, match } from 'react-router';
import Cookies from 'js-cookie';
import { trigger } from 'redial';
import configureStore from './modules/store/configureStore';
import getRoutes from './routes';


const initialState = window.__INITIAL_STATE__ || {}; //eslint-disable-line
const store = configureStore(initialState);
const routes = getRoutes(store);


const callTrigger = (renderProps) => {
    let promise = Promise.resolve();

    if (!renderProps) {
        return promise;
    }

    const { components } = renderProps;
    // Define locals to be provided to all lifecycle hooks:
    const locals = {
        path: renderProps.location.pathname,
        query: renderProps.location.query,
        params: renderProps.params,
        dispatch: store.dispatch,
        getState: store.getState,
        token: Cookies.get('jwt'),
    };

    // Don't fetch data for initial route, server has already done the work:
    if (window.INITIAL_STATE) {
        // Delete initial data so that subsequent data fetches can occur:
        delete window.INITIAL_STATE;
    } else {
        // Fetch mandatory data dependencies for 2nd route change onwards:
        promise = trigger('fetch', components, locals);
    }

    // Fetch deferred, client-only data dependencies:
    return promise.then(() => trigger('defer', components, locals));
};


const render = () => {
    const { pathname, search, hash } = window.location;
    const location = `${pathname}${search}${hash}`;

    // Pull child routes using match. Adjust Router for vanilla webpack HMR,
    // in development using a new key every time there is an edit.
    match({ routes, location }, (error, redirectLocation, renderProps) => {
        // Render app with Redux and router context to container element.
        // We need to have a random in development because of `match`'s dependency on
        // `routes.` Normally, we would want just one file from which we require `routes` from.
        callTrigger(renderProps).then(() => {
            ReactDOM.render(
                <Provider store={store} key={Math.random()}>
                    <Router history={browserHistory} routes={routes} key={Math.random()} />
                </Provider>,
                document.getElementById('root')
            );
        });
    });
};


// Listen for route changes on the browser history instance:
browserHistory.listen((location) => {
    // Match routes based on location object:
    match({ routes, location }, (error, redirectLocation, renderProps) => {
        // Get array of route handler components:
        if (!renderProps) return;
        callTrigger(renderProps);
    });
});

render();

// Hot Module Replacement API
if (module.hot) {
    module.hot.accept();
}
