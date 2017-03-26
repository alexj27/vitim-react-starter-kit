import React, { Component, PropTypes } from 'react';
import CanvasStream from '../components/CanvasStream';
import cursorImg from '../components/CanvasStream/img/cursor.png';


function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}


class CanvasStreamContainer extends Component {

    static propTypes = {
        capturedContext: PropTypes.object,
    };

    static defaultProps = {
        capturedContext: null,
    };

    state = {
        mouseEvt: null,
    };

    componentWillMount() {
        document.addEventListener('mousemove', this.onMouseMove, false);
    }

    componentWillReceiveProps(nextProps) {
        if (this.share && this.props.capturedContext && nextProps.capturedContext !== this.props.capturedContext) {
            typeof this.interval !== 'undefined' && clearInterval(this.interval);

            this.captureCanvasInterval(this.props.capturedContext).then((interval) => {
                this.interval = interval;
            });
        }
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', this.onMouseMove, false);
    }

    onMouseMove = (evt) => {
        this.state.mouseEvt = evt;
    };

    onInitCanvas = (canvas) => {
        this.share = canvas;
        if (this.props.capturedContext) {
            this.captureCanvasInterval(this.props.capturedContext).then((interval) => {
                this.interval = interval;
            });
        }
    };

    getStream = () => {
        return this.share.captureStream();
    };

    captureCanvasInterval = (srcCtx) => {
        if (!this.share) {
            return Promise.resolve(null);
        }
        const dstCanvas = this.share;
        const dstCtx = dstCanvas.getContext('2d');

        dstCtx.canvas.width = 500;
        dstCtx.canvas.height = 250;
        dstCtx.drawImage(srcCtx.canvas, 0, 0);

        const cursorImage = new Image();

        return new Promise((resolve) => {
            cursorImage.onload = () => {
                const timer = setInterval(() => {
                    if (this.state.mouseEvt) {
                        const pos = getMousePos(srcCtx.canvas, this.state.mouseEvt);
                        if (pos.x > 0 && pos.y > 0) {
                            const scaleX = srcCtx.canvas.width / dstCtx.canvas.width;
                            const scaleY = srcCtx.canvas.height / dstCtx.canvas.height;

                            dstCtx.drawImage(
                                srcCtx.canvas,
                                0, 0,
                                srcCtx.canvas.width, srcCtx.canvas.height,
                                0, 0,
                                dstCtx.canvas.width, dstCtx.canvas.height
                            );
                            dstCtx.drawImage(cursorImage, pos.x / scaleX - 5, pos.y / scaleY - 5, 20, 25);
                        }
                    }
                }, 100);
                resolve(timer);
            };
            cursorImage.src = cursorImg;
        });
    };

    render() {
        return <CanvasStream refCanvas={this.onInitCanvas} {...this.props} />;
    }
}


export default CanvasStreamContainer;
