import { createStore, applyMiddleware, compose } from 'redux';
import asyncMiddleware from 'redux-thunk';
import promiseMiddleware from '../middleware/promise';
import rootReducer from '../reducers';


export default function configureStore(initialState) {
    let store = createStore(rootReducer, initialState, compose(
        applyMiddleware(
            asyncMiddleware,
            promiseMiddleware
        )
    ));

    /* eslint-disable no-undef */
    if (typeof window !== 'undefined') {
        const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
            ?
            window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
                // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
            })
            : compose;

        store = createStore(rootReducer, initialState, composeEnhancers(
            applyMiddleware(
                asyncMiddleware,
                promiseMiddleware,
            )
        ));

        if (module.hot) {
            module.hot.accept('../reducers', () => {
                const nextRootReducer = require('../reducers').default;
                store.replaceReducer(nextRootReducer);
            });
        }
    }
    /* eslint-enable */

    return store;
}
