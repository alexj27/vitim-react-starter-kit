import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { WebRtc, CanvasStream, call, callAccept, callReject } from '../../../../Libs/WebRtcVIew';
import CanvasJsAnnotation from '../../../../Libs/CanvasJsAnnotation';
import './DemoWebRtc.less';


@connect(state => ({ users: state.signals.users, inCallFrom: state.signals.inCallFrom, ring: state.signals.ring }))
export default class DemoWebRtc extends PureComponent {
    state = {
        chart: window.chart1,
        drawable: false,
        clearChart: false,
    };

    clearChart = () => {
        this.state.canvasStream.clearAll();
    };

    clearLast = () => {
        this.state.canvasStream.clearLast();
    };

    render() {
        const { dispatch, users, ring, inCallFrom } = this.props;
        const { drawable } = this.state;

        return (
            <div className="DemoWebRtc container" >
                <CanvasJsAnnotation chart={window.chart2} onAnnotationAdded={(data) => alert(JSON.stringify(data))} drawable />
                <WebRtc>
                    <CanvasStream ref={com => (this.state.canvasStream = com)} drawable={drawable} chart={this.state.chart} />
                </WebRtc>

                <div>
                    <h4>Charts: </h4>
                    <button onClick={() => this.setState({ drawable: !drawable })} >{drawable ? 'Can draw' : 'View'}</button>
                    <button onClick={this.clearChart}>Clear All</button>
                    <button onClick={this.clearLast}>Clear Last</button>
                    <button onClick={() => this.setState({ chart: window.chart2 })} >Chart #1</button>
                    <button onClick={() => this.setState({ chart: window.chart1 })} >Chart #2</button>
                </div>
                <div>
                    <h4>Users: </h4>
                    {users.map(userId => (
                        <button
                            key={userId}
                            onClick={() => dispatch(call(userId))}
                        >{userId}</button>
                    ))}
                </div>
                {ring === 'incoming' && inCallFrom ?
                    <button onClick={() => dispatch(callAccept(inCallFrom))} >Accept</button> : null}
                {ring === 'incoming' && inCallFrom ?
                    <button onClick={() => dispatch(callReject(inCallFrom))} >Rejected</button> : null}



            </div>
        );
    }
}
