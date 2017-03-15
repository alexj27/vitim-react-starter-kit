import configureStore from './configureStore';

let store = null;

const getStore = (initialState, newStore) => {
    if (!store || newStore) {
        store = configureStore(initialState);
    }

    return store;
};

export default getStore;
