import React, { Component, PropTypes } from 'react';


class CanvasStream extends Component {
    static propTypes = {
        refCanvas: PropTypes.func.isRequired,
    };

    render() {
        return <canvas style={{ opacity: 0, position: 'absolute', top: '-100000px' }} ref={this.props.refCanvas} />;
    }
}


export default CanvasStream;
