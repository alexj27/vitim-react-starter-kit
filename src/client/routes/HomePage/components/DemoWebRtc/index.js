import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { WebRtc, CanvasStream, call, callAccept, callReject, sigLoadRegisteredUsers } from '../../../../Libs/WebRtcVIew';
import './DemoWebRtc.less';


@connect(state => ({ users: state.signals.users, inCallFrom: state.signals.inCallFrom, ring: state.signals.ring }))
export default class DemoWebRtc extends PureComponent {
    state = {
        chart: window.chart1.ctx,
    };

    componentWillMount(){
        this.interval = setInterval(() => {
            //this.props.dispatch(sigLoadRegisteredUsers());
        }, 4000);
    }

    componentWillUnmount(){
        clearInterval(this.interval);
    }

    render() {
        const { dispatch, users, ring, inCallFrom } = this.props;
        return (
            <div className="DemoWebRtc container" >
                <WebRtc>
                    <CanvasStream capturedContext={this.state.chart} />
                </WebRtc>

                <div>
                    <h4>Charts: </h4>
                    <button onClick={() => this.setState({ chart: window.chart2.ctx })} >Chart #1</button>
                    <button onClick={() => this.setState({ chart: window.chart1.ctx })} >Chart #2</button>
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
