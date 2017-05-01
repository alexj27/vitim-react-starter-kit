import axios from 'axios';


/************************************************************************************************
 * Batch object with methods
 ************************************************************************************************/

/**
 * Handling object for batch calls.
 */


export default class BatchObject {
    constructor(jsonRpcClient, allDoneCb, errorCb) {
        // Array of objects to hold the call and notify requests.  Each objects will have the request
        // object, and unless it is a notify, successCb and errorCb.
        this.requests = [];

        this.jsonRpcClient = jsonRpcClient;
        this.allDoneCb = allDoneCb;
        this.errorCb = typeof errorCb === 'function' ? errorCb : () => {};
    }

    /**
     * @sa call
     */
    call = (method, params, successCb, errorCb) => {
        if (!params) {
            params = {};
        }

        if (this.options.sessid) {
            params.sessid = this.options.sessid;
        }

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

        this.jsonRpcClient.currentId += 1;

        this.requests.push({
            request: {
                jsonrpc: '2.0',
                method,
                params,
                id: this.jsonRpcClient.currentId, // Use the client's id series.
            },
            successCb,
            errorCb,
        });
    };

    /**
     * @sa notify
     */
    notify = (method, params) => {
        if (this.options.sessid) {
            params.sessid = this.options.sessid;
        }

        this.requests.push({
            request: {
                jsonrpc: '2.0',
                method,
                params,
            }
        });
    };

    /**
     * Executes the batched up calls.
     */
    execute = () => {
        if (this.requests.length === 0) return; // All done :P

        // Collect all request data and sort handlers by request id.
        const batchRequest = [];
        const handlers = {};
        let call;
        let successCb;
        let errorCb;

        // If we have a WebSocket, just send the requests individually like normal calls.
        const socket = this.jsonRpcClient.options.getSocket(this.jsonRpcClient.wsOnMessage);
        if (socket !== null) {
            for (let i = 0; i < this.requests.length; i += 1) {
                call = this.requests[i];
                successCb = ('successCb' in call) ? call.successCb : undefined;
                errorCb = ('errorCb' in call) ? call.errorCb : undefined;
                this.jsonRpcClient.wsCall(socket, call.request, successCb, errorCb);
            }

            //if (typeof this.allDoneCb === 'function') this.allDoneCb(result);
            return;
        }

        for (let i = 0; i < this.requests.length; i += 1) {
            call = this.requests[i];
            batchRequest.push(call.request);

            // If the request has an id, it should handle returns (otherwise it's a notify).
            if ('id' in call.request) {
                handlers[call.request.id] = {
                    successCb: call.successCb,
                    errorCb: call.errorCb
                };
            }
        }

        successCb = (data) => {
            this.batchCb(data, handlers, this.allDoneCb);
        };

        // No WebSocket, and no HTTP backend?  This won't work.
        if (this.jsonRpcClient.options.ajaxUrl === null) {
            throw new Error('batch used with no websocket and no http endpoint.');
        }

        // Send request
        axios({
            url: self.jsonRpcClient.options.ajaxUrl,
            data: batchRequest,
            dataType: 'json',
            cache: false,
            type: 'POST',
        }).then(
            successCb
        ).catch(this.errorCb);
    };

    /**
     * Internal helper to match the result array from a batch call to their respective callbacks.
     *
     * @fn _batchCb
     * @memberof $.JsonRpcClient
     */
    batchCb = (result, handlers, allDoneCb) => {
        for (let i = 0; i < result.length; i += 1) {
            const response = result[i];

            // Handle error
            if ('error' in response) {
                if (response.id === null || !(response.id in handlers)) {
                    // An error on a notify?  Just log it to the console.
                    if ('console' in window) console.log(response);
                } else {
                    handlers[response.id].errorCb(response.error, this);
                }
            } else if (!(response.id in handlers) && 'console' in window) {
                console.log(response);
            } else {
                handlers[response.id].successCb(response.result, this);
            }
        }

        if (typeof allDoneCb === 'function') allDoneCb(result);
    };
}
