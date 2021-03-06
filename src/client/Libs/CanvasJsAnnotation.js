import React, { Component, PropTypes } from 'react';


function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}


class CanvasJsAnnotation extends Component {

    static propTypes = {
        drawable: PropTypes.bool,
        chart: PropTypes.object,
        onAnnotationAdded: PropTypes.func.isRequired,
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
        this.props.chart.options.zoomEnabled = false;
        this.props.chart.options.data.push(newSeries);
        this.props.chart.render();
    };

    onMouseUp = () => {
        this.props.chart.options.zoomEnabled = this.props.drawable;
        this.setState({ canDraw: false });
        this.props.onAnnotationAdded(this.props.chart.data.slice(-1)[0].dataPoints);
    };

    onMouseMove = (evt) => {
        this.state.mouseEvt = evt;
        if (this.props.drawable) {
            this.drawMarker(evt);
        }
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

    render() {
        return (
            <div />
        );
    }
}


export default CanvasJsAnnotation;
