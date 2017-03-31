import React, { Component, PropTypes } from 'react';


class CanvasStream extends Component {
    static propTypes = {
        refCanvas: PropTypes.func.isRequired,
    };

    render() {
        // style={{ opacity: 0, position: 'absolute', top: '-100000px' }}
        return <canvas ref={this.props.refCanvas} />;
    }
}


export default CanvasStream;
