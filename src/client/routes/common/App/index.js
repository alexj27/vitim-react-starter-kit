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
            <Scrollbars
                className="App"
                autoHeight
                autoHeightMin={this.props.viewport.height}
            >
                <div className="App-content">
                    {this.props.children}
                </div>
            </Scrollbars>
        );
    }
}


export default setViewport(App);
