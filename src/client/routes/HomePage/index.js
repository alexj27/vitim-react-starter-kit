import React, { PureComponent } from 'react';
import Header from './containers/Header';


export default class HomePage extends PureComponent {

    render() {
        return (
            <div className="HomePage">
                <Header {...this.props} />
            </div>
        );
    }
}
