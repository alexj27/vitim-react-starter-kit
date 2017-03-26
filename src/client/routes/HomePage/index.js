import React, { PureComponent } from 'react';
import Header from './containers/Header';
import DemoWebRtc from './components/DemoWebRtc';
import { WebRtc } from '../../Libs/WebRtcVIew';


export default class HomePage extends PureComponent {

    render() {
        return (
            <div className="HomePage">
                <DemoWebRtc />
            </div>
        );
    }
}
