import config from '../config/appConfig';
import * as actionTypes from '../actions';


function WebSocketClient() {
    this.number = 0;    // Message number
    this.autoReconnectInterval = 5 * 1000;    // ms
}


WebSocketClient.prototype.open = function (url) {
    this.url = url;
    this.instance = new WebSocket(this.url);
    this.instance.onopen = (e) => {
        this.onopen(e);
    };
    this.instance.onmessage = (data, flags) => {
        this.number += 1;
        this.onmessage(data, flags, this.number);
    };
    this.instance.onclose = (e) => {
        switch (e) {
            case 1000:  // CLOSE_NORMAL
                console.log('WebSocket: closed');
                break;
            default:    // Abnormal closure
                this.reconnect(e);
                break;
        }
        this.onclose(e);
    };
    this.instance.onerror = (e) => {
        switch (e.code) {
            case 'ECONNREFUSED':
                this.reconnect(e);
                break;
            default:
                this.onerror(e);
                break;
        }
    };
};

WebSocketClient.prototype.send = function(data, option) {
    try {
        this.instance.send(data, option);
    } catch (e) {
        this.instance.emit('error', e);
    }
};

WebSocketClient.prototype.reconnect = function(e){
    console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`, e);
    const that = this;
    setTimeout(() => {
        console.log('WebSocketClient: reconnecting...');
        that.open(that.url);
    }, this.autoReconnectInterval);
};


function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}


export default function signalsMiddleware({ dispatch, getState }) {
    const webSocket = new WebSocketClient();
    webSocket.open(config.WS_SERVER);

    webSocket.onopen = () => {
        //user registration
        const { auth: { user } } = getState();
        if (user) {
            webSocket.send(JSON.stringify({
                type: actionTypes.SIG_REGISTRATION,
                selfId: user.userId,
            }));
        }
        dispatch(actionTypes.sigConnected());
    };

    webSocket.onclose = () => {
        dispatch(actionTypes.sigNoConnection());
    };

    webSocket.onerror = () => {
        dispatch(actionTypes.wsError('Connection to signal server error'));
    };

    webSocket.onmessage = (response, flags, number) => {
        console.log('Info', response, flags, number);
        dispatch({ ...JSON.parse(response.data), fromServer: true });
    };

    return next => async (action) => {
        if (action.type.indexOf('SIG') === -1 || action.fromServer || action.type.indexOf('TRIGGERED') > -1) {
            return next(action);
        }

        dispatch({ ...action, type: actionTypes.triggered(action.type) });

        return new Promise(async (resolve) => {
            const { signals: { connected } } = getState();
            while (!connected) {
                await sleep(3000);
            }

            webSocket.send(JSON.stringify(action));
            resolve(action);
        });
    };
}
