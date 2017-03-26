import React, { Component, PropTypes } from 'react';


class WebRtc extends Component {
    static propTypes = {
        selfViewSrc: PropTypes.string,
        remoteViewSrc: PropTypes.string,
    };

    static defaultProps = {
        selfViewSrc: null,
        remoteViewSrc: null,
    };

    render() {
        const { selfViewSrc, remoteViewSrc } = this.props;
        return (
            <div className="WebRtc" >
                {selfViewSrc && <video className="WebRtc-self" autoPlay src={selfViewSrc} /> }
                {remoteViewSrc && <video className="WebRtc-remote" autoPlay src={remoteViewSrc} /> }
            </div>
        );
    }
}


export default WebRtc;
