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
        drawable: PropTypes.bool,
        chart: PropTypes.object,
    };

    static defaultProps = {
        drawable: false,
        chart: null,
    };

    state = {
        mouseEvt: null,
        canDraw: false
    };

    componentWillMount() {
        document.addEventListener('mousemove', this.onMouseMove, false);
        document.addEventListener('mousedown', this.onMouseDown, false);
        document.addEventListener('mouseup', this.onMouseUp, false);
    }

    componentWillReceiveProps(nextProps) {
        if (this.share && this.props.chart && nextProps.chart !== this.props.chart) {
            typeof this.interval !== 'undefined' && clearInterval(this.interval);

            this.captureCanvasInterval(this.props.chart.ctx).then((interval) => {
                this.interval = interval;
            });
        }

        if (this.props.chart && nextProps.drawable !== this.props.drawable) {
            this.props.chart.options.zoomEnabled = this.props.drawable;
        }
    }

    componentWillUnmount() {
        document.removeEventListener('mousemove', this.onMouseMove, false);
        document.removeEventListener('mousedown', this.onMouseDown, false);
        document.removeEventListener('mouseup', this.onMouseUp, false);
    }

    onMouseDown = () => {
        this.setState({ canDraw: true });
        const newSeries = {
            type: 'line',
            showInLegend: false,
            markerType: 'none',
            dataPoints: []
        };
        this.props.chart.options.data.push(newSeries);
        this.props.chart.render();
    };

    onMouseUp = () => {
        this.setState({ canDraw: false });
    };

    onMouseMove = (evt) => {
        this.state.mouseEvt = evt;
        if (this.props.drawable) {
            this.drawMarker(evt);
        }
    };

    onInitCanvas = (canvas) => {
        this.share = canvas;
        if (this.props.chart.ctx) {
            this.captureCanvasInterval(this.props.chart.ctx).then((interval) => {
                this.interval = interval;
            });
        }
    };

    getStream = () => {
        return this.share.captureStream(25);
    };

    clearAll = () => {
        const { chart } = this.props;

        if (chart && chart.options.data.length > 1) {
            chart.options.data = chart.options.data.slice(0, 1);
            chart.render();
        }
    };

    clearLast = () => {
        const { chart } = this.props;

        if (chart && chart.options.data.length > 1) {
            chart.options.data.pop();
            chart.render();
        }
    };

    drawMarker = (mouseEvt) => {
        const {
            chart: {
                axisX: [{ viewportMinimum: minX, range: rangeX }],
                axisY: [{ viewportMinimum: minY, range: rangeY }],
            }
        } = this.props;
        const { chart: { plotArea: { x1, x2, y1, y2, width, height } } } = this.props;

        const { x, y } = getMousePos(this.props.chart.ctx.canvas, mouseEvt);

        if (x1 <= x && x <= x2 && y1 <= y && y <= y2) {
            const mouseX = x - x1;
            const mouseY = height - (y - y1);
            const koefX = (rangeX / width);
            const koefY = (rangeY / height);
            const dataX = (mouseX * koefX) + minX;
            const dataY = (mouseY * koefY) + minY;

            if (this.state.canDraw) {
                this.props.chart.data.slice(-1)[0].dataPoints.push({ x: dataX, y: dataY, lineColor: 'red' });
                this.props.chart.render();
            }
        }
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
                }, 50);
                resolve(timer);
            };
            cursorImage.src = cursorImg;
        });
    };

    render() {
        return (
            <div>
                <CanvasStream refCanvas={this.onInitCanvas} {...this.props} />
            </div>
        );
    }
}


export default CanvasStreamContainer;
