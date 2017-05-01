import axios from 'axios';
import BatchObject from './BatchObject';


export default class JsonRpcClient {
    wsCnt = 0;
    wsSocket = null;
    wsCallbacks = {};
    currentId = 1;

    /**
     * Queue to save messages delivered when websocket is not ready
     */
    q = [];


    constructor(options) {
        this.options = {
            ajaxUrl: null,
            socketUrl: null, ///< The ws-url for default getSocket.
            onMessage: null, ///< Other onmessage-handler.
            login: null, /// auth login
            passwd: null, /// auth passwd
            sessionId: null,
            loginParams: null,
            onWsClose: null,
            onWsLogin: null,
            userVariables: {},
            userconstiables: null,
            sessid: null,
            getSocket: onMessageCb => this.getSocket(onMessageCb),
            ...options,
        };
    }

    loginData = (params) => {
        this.options.login = params.login;
        this.options.passwd = params.passwd;
        this.options.loginParams = params.loginParams;
        this.options.userVariables = params.userVariables;
    };

    speedTest = (bytes, cb) => {
        const socket = this.options.getSocket(this.wsOnMessage);

        if (socket !== null) {
            this.speedCB = cb;
            this.speedBytes = bytes;
            socket.send(`#SPU ${bytes}`);

            const loops = bytes / 1024;
            const rem = bytes % 1024;
            const data = new Array(1024).join('.');

            for (let i = 0; i < loops; i += 1) {
                socket.send(`#SPU ${data}`);
            }

            if (rem) {
                socket.send(`#SPU ${data}`);
            }

            socket.send('#SPE');
        }
    };

    /**
     * @fn call
     * @memberof JsonRpcClient
     *
     * @param method     The method to run on JSON-RPC server.
     * @param params     The params; an array or object.
     * @param successCb A callback for successful request.
     * @param errorCb   A callback for error.
     */
    call = (method, params, successCb, errorCb) => {
        // Construct the JSON-RPC 2.0 request.

        if (!params) {
            params = {};
        }

        if (this.options.sessid) {
            params.sessid = this.options.sessid;
        }

        this.currentId += 1; // Increase the id counter to match request/response

        const request = {
            jsonrpc: '2.0',
            method,
            params,
            id: this.currentId,
        };

        if (!successCb) {
            successCb = (e) => {
                console.log('Success: ', e);
            };
        }

        if (!errorCb) {
            errorCb = (e) => {
                console.log('Error: ', e);
            };
        }

        // Try making a WebSocket call.
        const socket = this.options.getSocket(this.wsOnMessage);

        if (socket !== null) {
            this.wsCall(socket, request, successCb, errorCb);
            return;
        }

        // No WebSocket, and no HTTP backend?  This won't work.
        if (this.options.ajaxUrl === null) {
            throw new Error('JsonRpcClient.call used with no websocket and no http endpoint.');
        }

        axios({
            type: 'post',
            url: this.options.ajaxUrl,
            data: request,
            dataType: 'json',
            cache: false
        }).then((response) => {
            if ('error' in response.data) errorCb(response.data.error, this);
            successCb(response.data, this);
        }).catch((error) => {
            try {
                const response = error.response.data;
                errorCb(response.error, this);
            } catch (err) {
                // Perhaps the responseText wasn't really a jsonrpc-error.
                errorCb({ error: error.response.data }, this);
            }
        });
    };

    /**
     * Notify sends a command to the server that won't need a response.  In http, there is probably
     * an empty response - that will be dropped, but in ws there should be no response at all.
     *
     * This is very similar to call, but has no id and no handling of callbacks.
     *
     * @fn notify
     * @memberof JsonRpcClient
     *
     * @param method     The method to run on JSON-RPC server.
     * @param params     The params; an array or object.
     */
    notify = (method, params) => {
        // Construct the JSON-RPC 2.0 request.

        if (this.options.sessid) {
            params.sessid = this.options.sessid;
        }

        const request = {
            jsonrpc: '2.0',
            method,
            params
        };

        // Try making a WebSocket call.
        const socket = this.options.getSocket(this.wsOnMessage);
        if (socket !== null) {
            this.wsCall(socket, request);
            return;
        }

        // No WebSocket, and no HTTP backend?  This won't work.
        if (this.options.ajaxUrl === null) {
            throw new Error('JsonRpcClient.notify used with no websocket and no http endpoint.');
        }

        axios({
            type: 'POST',
            url: this.options.ajaxUrl,
            data: request,
            dataType: 'json',
            cache: false
        });
    };

    /**
     * Make a batch-call by using a callback.
     *
     * The callback will get an object 'batch' as only argument.  On batch, you can call the methods
     * 'call' and 'notify' just as if it was a normal $.JsonRpcClient object, and all calls will be
     * sent as a batch call then the callback is done.
     *
     * @fn batch
     * @memberof $.JsonRpcClient
     *
     * @param callback    The main  which will get a batch handler to run call and notify on.
     * @param allDoneCb A callback  to call after all results have been handled.
     * @param errorCb    A callback  to call if there is an error from the server.
     *                    Note, that batch calls should always get an overall success, and the
     *                    only error
     */
    batch = (callback, allDoneCb, errorCb) => {
        const batch = new BatchObject(this, allDoneCb, errorCb);
        callback(batch);
        batch.execute();
    };

    /**
     * The default getSocket handler.
     *
     * @param onmessage_cb The callback to be bound to onmessage events on the socket.
     *
     * @fn _getSocket
     * @memberof $.JsonRpcClient
     */

    socketReady = () => {
        if (this.wsSocket === null || this.wsSocket.readyState > 1) {
            return false;
        }

        return true;
    };

    closeSocket = () => {
        if (this.socketReady()) {
            this.wsSocket.onclose = () => {
                console.log('Closing Socket');
            };
            this.wsSocket.close();
        }
    };

    connectSocket = (onMessageCb) => {
        if (this.to) {
            clearTimeout(this.to);
        }
        if (!this.socketReady()) {
            this.authing = false;

            if (this.wsSocket) {
                delete this.wsSocket;
            }

            // No socket, or dying socket, let's get a new one.
            this.wsSocket = new WebSocket(this.options.socketUrl);

            if (this.wsSocket) {
                // Set up onmessage handler.
                this.wsSocket.onmessage = onMessageCb;
                this.wsSocket.onclose = () => {
                    if (!this.ws_sleep) {
                        this.ws_sleep = 1000;
                    }

                    if (this.options.onWsClose) {
                        this.options.onWsClose(this);
                    }

                    console.warning('Websocket Lost ' + this.wsCnt + ' sleep: ' + this.ws_sleep + 'msec');

                    this.to = setTimeout(() => {
                        console.log('Attempting Reconnection....');
                        this.connectSocket(onMessageCb);
                    }, this.ws_sleep);

                    this.wsCnt += 1;

                    if (this.ws_sleep < 3000 && (this.wsCnt % 10) === 0) {
                        this.ws_sleep += 1000;
                    }
                };

                // Set up sending of message for when the socket is open.
                this.wsSocket.onopen = () => {
                    console.info('Websocket connected to ', this.options.socketUrl);
                    if (this.to) {
                        clearTimeout(this.to);
                    }
                    this.ws_sleep = 1000;
                    this.wsCnt = 0;
                    if (this.options.onWsConnect) {
                        this.options.onWsConnect(this);
                    }

                    // Send the requests.
                    let req = this.q.pop();
                    while (req) {
                        this.wsSocket.send(req);
                        req = this.q.pop();
                    }
                };
            }
        }

        return !!this.wsSocket;
    };

    stopRetrying = () => {
        if (this.to) {
            clearTimeout(this.to);
        }
    };

    getSocket = (onMessageCb) => {
        // If there is no ws url set, we don't have a socket.
        // Likewise, if there is no window.WebSocket.
        if (this.options.socketUrl === null) return null;

        this.connectSocket(onMessageCb);

        return this.wsSocket;
    };

    /**
     * Internal handler to dispatch a JRON-RPC request through a websocket.
     *
     * @fn _wsCall
     * @memberof $.JsonRpcClient
     */
    wsCall = (socket, request, successCb, errorCb) => {
        const requestJson = JSON.stringify(request);

        if (socket.readyState < 1) {
            // The websocket is not open yet; we have to set sending of the message in onopen.
            this.q.push(requestJson);
        } else {
            // We have a socket and it should be ready to send on.
            console.log('Send request:', request);
            socket.send(requestJson);
        }

        // Setup callbacks.  If there is an id, this is a call and not a notify.
        if ('id' in request && typeof successCb !== 'undefined') {
            this.wsCallbacks[request.id] = {
                request: requestJson,
                requestObj: request,
                successCb,
                errorCb,
            };
        }
    };

    /**
     * Internal handler for the websocket messages.  It determines if the message is a JSON-RPC
     * response, and if so, tries to couple it with a given callback.  Otherwise, it falls back to
     * given external onmessage-handler, if any.
     *
     * @param event The websocket onmessage-event.
     */
    wsOnMessage = (event) => {
        // Check if this could be a JSON RPC message.
        let response;

        // Special sub proto
        if (event.data[0] === '#' && event.data[1] === 'S' && event.data[2] === 'P') {
            if (event.data[3] === 'U') {
                this.upDur = parseInt(event.data.substring(4), 10);
            } else if (this.speedCB && event.data[3] === 'D') {
                this.downDur = parseInt(event.data.substring(4), 10);

                const upKps = (((this.speedBytes * 8) / (this.upDur / 1000)) / 1024).toFixed(0);
                const downKps = (((this.speedBytes * 8) / (this.downDur / 1000)) / 1024).toFixed(0);

                console.info('Speed Test: Up: ', upKps, ' Down: ', downKps);
                this.speedCB(event, { upDur: this.upDur, downDur: this.downDur, upKPS: upKps, downKPS: downKps });
                this.speedCB = null;
            }

            return;
        }

        try {
            response = JSON.parse(event.data);
            console.log('Recive event', event.data);

            /// @todo Make using the jsonrcp 2.0 check optional, to use this on JSON-RPC 1 backends.

            if (typeof response === 'object' && 'jsonrpc' in response && response.jsonrpc === '2.0') {
                /// @todo Handle bad response (without id).

                // If this is an object with result, it is a response.
                if ('result' in response && this.wsCallbacks[response.id]) {
                    // Get the success callback.
                    const successCb = this.wsCallbacks[response.id].successCb;

                    // set the sessid if present
                    if ((response.result.sessid && !this.options.sessid) || (this.options.sessid !== response.result.sessid)) {
                        this.options.sessid = response.result.sessid;
                        if (this.options.sessid) {
                            console.log('setting session UUID to: ' + this.options.sessid);
                        }
                    }

                    // Delete the callback from the storage.
                    delete this.wsCallbacks[response.id];

                    // Run callback with result as parameter.
                    successCb(response.result, this);
                    return;
                } else if ('error' in response && this.wsCallbacks[response.id]) {
                    // If this is an object with error, it is an error response.

                    // Get the error callback.
                    const errorCb = this.wsCallbacks[response.id].errorCb;
                    const origReq = this.wsCallbacks[response.id].request;

                    // if this is an auth request, send the credentials and resend the failed request
                    if (!this.authing && response.error.code === -32000 && this.options.login && this.options.passwd) {
                        this.authing = true;

                        this.call(
                            'login',
                            {
                                login: this.options.login,
                                passwd: this.options.passwd,
                                loginParams: this.options.loginParams,
                                userconstiables: this.options.userconstiables
                            },
                            this.wsCallbacks[response.id].requestObj.method === 'login' ?
                                () => {
                                    this.authing = false;
                                    console.log('logged in');
                                    delete this.wsCallbacks[response.id];

                                    if (this.options.onWsLogin) {
                                        this.options.onWsLogin(true, this);
                                    }
                                } :
                                () => {
                                    this.authing = false;
                                    console.log('logged in, resending request id: ' + response.id);
                                    const socket = this.options.getSocket(this.wsOnMessage);
                                    if (socket !== null) {
                                        socket.send(origReq);
                                    }
                                    if (this.options.onWsLogin) {
                                        this.options.onWsLogin(true, this);
                                    }
                                },
                            () => {
                                console.log('error logging in, request id:', response.id);
                                delete this.wsCallbacks[response.id];
                                errorCb(response.error, this);
                                if (this.options.onWsLogin) {
                                    this.options.onWsLogin(false, this);
                                }
                            });
                        return;
                    }

                    // Delete the callback from the storage.
                    delete this.wsCallbacks[response.id];

                    // Run callback with the error object as parameter.
                    errorCb(response.error, this);
                    return;
                }
            }
        } catch (err) {
            // Probably an error while parsing a non json-string as json.  All real JSON-RPC cases are
            // handled above, and the fallback method is called below.
            console.log('ERROR: ', err);
            return;
        }

        // This is not a JSON-RPC response.  Call the fallback message handler, if given.
        if (typeof this.options.onmessage === 'function') {
            event.eventData = response;
            if (!event.eventData) {
                event.eventData = {};
            }

            const reply = this.options.onmessage(event);

            if (reply && typeof reply === 'object' && event.eventData.id) {
                const msg = {
                    jsonrpc: '2.0',
                    id: event.eventData.id,
                    result: reply
                };

                const socket = this.options.getSocket(this.wsOnMessage);
                if (socket !== null) {
                    socket.send(JSON.stringify(msg));
                }
            }
        }
    };
}
