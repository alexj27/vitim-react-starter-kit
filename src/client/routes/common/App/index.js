import React, { Component, PropTypes } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import setViewport from './setViewport';
import './App.less';


class App extends Component {
    static propTypes = {
        viewport: PropTypes.object.isRequired,
        children: PropTypes.object.isRequired,
    };

    static defaultProps = {
        user: PropTypes.object,
    };


    render() {
        return (
            <div
                className="App"
            >
                <div className="App-content">
                    {this.props.children}
                </div>
            </div>
        );
    }
}


export default setViewport(App);
