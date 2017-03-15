import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './common/App';
import NotFoundPage from './NotFoundPage';
import HomePage from './HomePage';
import ContentPage, { FAQ, Contact, Police } from './ContentPage';
// import { checkAuth, authNoRequired, authRequired, authLogout } from '../helpers/routes';


export default function routes() {
    return (
        <Route path="/" component={App}>
            <IndexRoute component={HomePage} />
            <Route path="contents/" component={ContentPage}>
                <Route path="faq" component={FAQ} />
                <Route path="police" component={Police} />
                <Route path="contact" component={Contact} />
            </Route>
            <Route path="*" component={NotFoundPage} />
        </Route>
    );
}
