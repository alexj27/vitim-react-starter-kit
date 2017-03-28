import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import WebRtc from '../components/WebRtc';
import * as actions from '../actions';


const configuration = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };

const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;


function logError(error) {
    console.error(error);
}


function getLocalStream(camera, callback) {
    navigator.getUserMedia({ audio: true, video: true }, (stream) => {
        callback(stream);
    }, logError);
}


class WebRtcContainer extends Component {
    static propTypes = {
        callState: PropTypes.object.isRequired,
        dispatch: PropTypes.func.isRequired,
        caller: PropTypes.string,
        children: PropTypes.object,
    };

    static defaultProps = {
        call: false,
        caller: null,
        children: null,
    };

    state = {
        recipient: null,
        localStream: null,
        selfViewSrc: null,
        status: null,
        remoteViewSrc: null,
        info: '',
        ready: false,
        remoteList: {},
        pc: null,
    };

    componentWillMount() {
        const { dispatch } = this.props;
        getLocalStream(true, (stream) => {
            dispatch(actions.webRtcCameraCaptured(URL.createObjectURL(stream)));

            this.setState({
                selfViewSrc: URL.createObjectURL(stream),
                localStream: stream,
            });
        });
    }

    componentWillReceiveProps(nextProps) {
        const { callState: { ring, caller, exchangeData } } = nextProps;

        if (ring !== this.props.callState.ring && ring === 'up' && caller) {
            // start calling
            this.createPC(caller, true);
        }
        if (exchangeData && exchangeData !== this.props.callState.exchangeData) {
            // exchange data
            this.exchange(exchangeData);
        }
        if (!ring && ring !== this.props.callState.ring && ring) {
            this.leave();
        }
    }

    componentWillUnmount() {
        this.leave();
    }

    exchange = (data) => {
        const { dispatch } = this.props;

        const fromId = data.from;
        let pc;

        if (this.state.pc) {
            pc = this.state.pc;
        } else {
            pc = this.createPC(fromId, false);
        }

        if (data.sdp) {
            pc.setRemoteDescription(new RTCSessionDescription(data.sdp), () => {
                if (pc.remoteDescription.type === 'offer') {
                    pc.createAnswer((desc) => {
                        pc.setLocalDescription(desc, () => {
                            dispatch(actions.sigExchange(fromId, { sdp: pc.localDescription }));
                        }, logError);
                    }, logError);
                }
            }, logError);
        } else {
            pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    };

    createOffer = (fromId) => {
        const { dispatch } = this.props;
        const { pc } = this.state;

        pc.createOffer((desc) => {
            this.state.pc.setLocalDescription(desc, () => {
                dispatch(actions.sigExchange(fromId, { sdp: pc.localDescription }));
            }, logError);
        }, logError);
    };

    createPC = (fromId, isOffer) => {
        const { dispatch } = this.props;
        const pc = new RTCPeerConnection(configuration);
        this.state.pc = pc;

        pc.onicecandidate = (event) => {
            console.log('onicecandidate', event.candidate);
            if (event.candidate) {
                dispatch(actions.sigExchange(fromId, { candidate: event.candidate }));
            }
        };

        pc.onnegotiationneeded = () => {
            console.log('onnegotiationneeded');
            if (isOffer) {
                this.createOffer(fromId);
            }
        };

        pc.oniceconnectionstatechange = (event) => {
            const { localStream, pc } = this.state;
            console.log('oniceconnectionstatechange', event.target.iceConnectionState);
            if (event.target.iceConnectionState === 'disconnected') {
                pc && pc.removeStream(localStream);
                pc && pc.close();
                this.setState({
                    pc: null,
                    share: null,
                    remoteViewSrc: null,
                });
            }
        };

        pc.onsignalingstatechange = (event) => {
            console.log('onsignalingstatechange >>>>>>', event);
            console.log('onsignalingstatechange', event.target.signalingState);
        };

        pc.onaddstream = (event) => {
            console.log('onaddstream', event.stream);
            const type = event.stream.getTracks().length === 1 ? 'share' : 'caller';

            if (type === 'share') {
                this.setState({ share: URL.createObjectURL(event.stream), info: 'Share makeCall!' });
            } else {
                this.setState({ remoteViewSrc: URL.createObjectURL(event.stream), info: 'Doctor makeCall!' });
            }
        };

        pc.onremovestream = (event) => {
            console.log('onremovestream', event.stream);
        };

        pc.addStream(this.state.localStream);
        this.cStream && pc.addStream(this.cStream.getStream());

        return pc;
    };

    leave = () => {
        const { dispatch, callState: { inCallFrom, caller } } = this.props;
        const { localStream, pc } = this.state;
        console.log('Leave: ', localStream.release);

        if (localStream && localStream.release) {
            localStream.release();
            pc && pc.removeStream(localStream);
            pc && pc.close();
            this.setState({
                pc: null,
                share: null,
                remoteViewSrc: null,
            });
            dispatch(actions.sigHungUp(inCallFrom || caller));
        }
    };

    render() {
        return (
            <div>
                <WebRtc
                    {...this.props}
                    {...this.state}
                />
                {
                    this.props.children && (
                        React.cloneElement(this.props.children, {
                            ref: cStream => (this.cStream = cStream)
                        })
                    )
                }
            </div>
        );
    }
}


export default connect(state => ({ callState: state.signals, webrtcState: state.webRtc }))(WebRtcContainer);
