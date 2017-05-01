import FSRTC from './FSRTC';
import JsonRpcClient from './JsonRpcClient';
import {
    generateGUID
} from './helpers';
import enumeration from './enum';
import VertoAPIDialog from './VertoAPIDialog';


const SERNO = 1;


export default class VertoAPI {

    enumerator = Object.freeze(enumeration);

    constructor(options, callbacks) {
        this.options = {
            login: null,
            passwd: null,
            socketUrl: null,
            tag: null,
            localTag: null,
            videoParams: {},
            audioParams: {},
            loginParams: {},
            deviceParams: { onResCheck: null },
            userconstiables: {},
            iceServers: false,
            ringSleep: 6000,
            sessid: null,
            ...options
        };

        if (this.options.deviceParams.useCamera) {
            FSRTC.getValidRes(this.options.deviceParams.useCamera, this.options.deviceParams.onResCheck);
        }

        if (!this.options.deviceParams.useMic) {
            this.options.deviceParams.useMic = 'any';
        }

        if (!this.options.deviceParams.useSpeak) {
            this.options.deviceParams.useSpeak = 'any';
        }

        if (this.options.sessid) {
            this.sessid = this.options.sessid;
        } else {
            this.sessid = generateGUID();
        }

        this.dialogs = {};
        this.callbacks = callbacks || {};
        this.eventSUBS = {};

        this.rpcClient = new JsonRpcClient({
            sessid: this.sessid,
            onmessage: (e) => {
                return this.handleMessage(e.eventData);
            },
            onWSConnect: (o) => {
                o.call('login', {});
            },
            onWSLogin: (success) => {
                if (this.callbacks.onWSLogin) {
                    this.callbacks.onWSLogin(this, success);
                }
            },
            onWSClose: (success) => {
                if (this.callbacks.onWSClose) {
                    this.callbacks.onWSClose(this, success);
                }
                this.purge();
            },
            ...options,
        });

        this.rpcClient.call('login', {});
    }

    deviceParams = (obj) => {
        this.options.deviceParams = { ...this.options.deviceParams, ...obj };

        if (obj.useCamera) {
            this.frtc.getValidRes(this.options.deviceParams.useCamera, obj ? obj.onResCheck : undefined);
        }
    };

    videoParams = (obj) => {
        this.options.videoParams = { ...this.options.videoParams, ...obj };
    };

    iceServers = (obj) => {
        this.options.iceServers = obj;
    };

    loginData = (params) => {
        this.options.login = params.login;
        this.options.passwd = params.passwd;
        this.rpcClient.loginData(params);
    };

    logout = () => {
        this.rpcClient.closeSocket();
        if (this.callbacks.onWSClose) {
            this.callbacks.onWSClose(this, false);
        }
        this.purge();
    };

    login = () => {
        this.logout();
        this.rpcClient.call('login', {});
    };

    message = (msg) => {
        let err = 0;

        if (!msg.to) {
            console.error('Missing To');
            err += 1;
        }

        if (!msg.body) {
            console.error('Missing Body');
            err += 1;
        }

        if (err) {
            return false;
        }

        this.sendMethod('this.info', {
            msg
        });

        return true;
    };

    doSub = (channel, obj) => {
        console.log('Do sub', channel, obj);
    };

    dropBad = (verto, channel) => {
        console.warning('drop unauthorized channel: ' + channel);
        delete verto.eventSUBS[channel];
    };

    markReady(channel) {
        Object.keys(this.eventSUBS[channel]).forEach((j) => {
            this.eventSUBS[channel][j].ready = true;
            console.log('subscribed to channel: ' + channel);
            if (this.eventSUBS[channel][j].readyHandler) {
                this.eventSUBS[channel][j].readyHandler(this, channel);
            }
        });
    }

    processReply = (method, success, e) => {
        console.log('Response: ' + method, success, e);

        switch (method) {
            case 'this.subscribe':
                Object.keys(e.unauthorizedChannels).forEach((key) => {
                    this.dropBad(e.unauthorizedChannels[key]);
                    this.markReady(e.subscribedChannels[key]);
                });
                break;
            case 'this.unsubscribe':
                //console.error(e);
                break;
            default:
                break;
        }
    };

    sendMethod = (method, params) => {
        this.rpcClient.call(method, params,
            (e) => {
                /* Success */
                this.processReply(method, true, e);
            },
            (e) => {
                /* Error */
                this.processReply(method, false, e);
            }
        );
    };

    doSubscribe = (verto, channel, subChannels, sparams) => {
        const params = sparams || {};

        const local = params.local;

        const obj = {
            eventChannel: channel,
            userData: params.userData,
            handler: params.handler,
            ready: false,
            readyHandler: params.readyHandler,
            serno: SERNO + 1
        };

        let isnew = false;

        if (!this.eventSUBS[channel]) {
            this.eventSUBS[channel] = [];
            subChannels.push(channel);
            isnew = true;
        }

        this.eventSUBS[channel].push(obj);

        if (local) {
            obj.ready = true;
            obj.local = true;
        }

        if (!isnew && this.eventSUBS[channel][0].ready) {
            obj.ready = true;
            if (obj.readyHandler) {
                obj.readyHandler(verto, channel);
            }
        }

        return {
            serno: obj.serno,
            eventChannel: channel
        };
    };

    subscribe = (channel, sparams) => {
        const verto = this;
        const r = [];
        const subChannels = [];
        const params = sparams || {};

        if (typeof channel === 'string') {
            r.push(this.doSubscribe(verto, channel, subChannels, params));
        } else {
            Object.keys(this.eventSUBS).forEach(() => {
                r.push(this.doSubscribe(this, channel, subChannels, params));
            });
        }

        if (subChannels.length) {
            this.sendMethod('this.subscribe', {
                eventChannel: subChannels.length === 1 ? subChannels[0] : subChannels,
                subParams: params.subParams
            });
        }

        return r;
    };

    unsubscribe = (handle) => {
        if (!handle) {
            Object.keys(this.eventSUBS).forEach((key) => {
                this.unsubscribe(this.eventSUBS[key]);
            });
        } else {
            const unsubChannels = {};
            const sendChannels = [];
            let channel;

            if (typeof handle === 'string') {
                delete this.eventSUBS[handle];
                this.unsubChannels[handle] += 1;
            } else {
                Object.keys(handle).forEach((i) => {
                    if (typeof handle[i] === 'string') {
                        channel = handle[i];
                        delete this.eventSUBS[channel];
                        this.unsubChannels[channel] += 1;
                    } else {
                        const repl = [];
                        channel = handle[i].eventChannel;

                        Object.keys(this.eventSUBS[channel]).forEach((j) => {
                            if (this.eventSUBS[channel][j].serno !== handle[i].serno) {
                                repl.push(this.eventSUBS[channel][j]);
                            }
                        });

                        this.eventSUBS[channel] = repl;

                        if (this.eventSUBS[channel].length === 0) {
                            delete this.eventSUBS[channel];
                            this.unsubChannels[channel] += 1;
                        }
                    }
                });
            }

            Object.keys(unsubChannels).forEach((u) => {
                console.log('Sending Unsubscribe for: ', u);
                sendChannels.push(u);
            });

            if (sendChannels.length) {
                this.sendMethod('this.unsubscribe', {
                    eventChannel: sendChannels.length === 1 ? sendChannels[0] : sendChannels
                });
            }
        }
    };

    broadcast = (channel, params) => {
        const msg = {
            eventChannel: channel,
            data: { ...params },
        };
        this.sendMethod('this.broadcast', msg);
    };

    purge = () => {
        this.eventSUBS.forEach((eventSUB, i) => {
            if (eventSUB) {
                console.log('purging subscription: ' + i);
                delete this.eventSUBS[i];
            }
        });
    };

    hangup = (callID) => {
        if (callID) {
            const dialog = this.dialogs[callID];

            if (dialog) {
                dialog.hangup();
            }
        }
    };

    newCall = (args, callbacks) => {
        if (!this.rpcClient.socketReady()) {
            console.error('Not Connected...');
            return null;
        }

        const dialog = new VertoAPIDialog(this.enumerator.direction.outbound, this, args);

        dialog.invite();

        if (callbacks) {
            dialog.callbacks = callbacks;
        }

        return dialog;
    };

    handleMessage = (data) => {
        if (!(data && data.method)) {
            console.error('Invalid Data', data);
            return null;
        }

        if (data.params.callID) {
            const dialog = this.dialogs[data.params.callID];

            if (data.method === 'this.attach' && dialog) {
                delete dialog.this.dialogs[dialog.callID];
                dialog.rtc.stop();
                this.dialog = null;
            }

            if (dialog) {
                switch (data.method) {
                    case 'verto.bye':
                        dialog.hangup(data.params);
                        break;
                    case 'verto.answer':
                        dialog.handleAnswer(data.params);
                        break;
                    case 'verto.media':
                        dialog.handleMedia(data.params);
                        break;
                    case 'verto.display':
                        dialog.handleDisplay(data.params);
                        break;
                    case 'verto.info':
                        dialog.handleInfo(data.params);
                        break;
                    default:
                        console.debug('INVALID METHOD OR NON-EXISTANT CALL REFERENCE IGNORED', data.method);
                        break;
                }
            } else {
                switch (data.method) {
                    case 'verto.attach':
                        data.params.attach = true;

                        if (data.params.sdp && data.params.sdp.indexOf('m=video') > 0) {
                            data.params.useVideo = true;
                        }

                        if (data.params.sdp && data.params.sdp.indexOf('stereo=1') > 0) {
                            data.params.useStereo = true;
                        }

                        break;
                    case 'verto.invite':

                        if (data.params.sdp && data.params.sdp.indexOf('m=video') > 0) {
                            data.params.wantVideo = true;
                        }

                        if (data.params.sdp && data.params.sdp.indexOf('stereo=1') > 0) {
                            data.params.useStereo = true;
                        }
                        break;
                    default:
                        console.debug('INVALID METHOD OR NON-EXISTANT CALL REFERENCE IGNORED');
                        break;
                }
            }
            return data;
        } else {
            switch (data.method) {
                case 'verto.punt':
                    this.purge();
                    this.logout();
                    break;
                case 'verto.event': {
                    let list = null;
                    let key = null;

                    if (data.params) {
                        key = data.params.eventChannel;
                    }

                    if (key) {
                        list = this.eventSUBS[key];

                        if (!list) {
                            list = this.eventSUBS[key.split('.')[0]];
                        }
                    }

                    if (!list && key && key === this.sessid) {
                        if (this.callbacks.onMessage) {
                            this.callbacks.onMessage(this, null, this.enum.message.pvtEvent, data.params);
                        }
                    } else if (!list && key && this.dialogs[key]) {
                        this.dialogs[key].sendMessage(this.enum.message.pvtEvent, data.params);
                    } else if (!list) {
                        if (!key) {
                            key = 'UNDEFINED';
                        }
                        console.error('UNSUBBED or invalid EVENT ' + key + ' IGNORED');
                    } else {
                        list.forEach((sub) => {
                            if (!sub || !sub.ready) {
                                console.warning('invalid EVENT for ' + key + ' IGNORED');
                            } else if (sub.handler) {
                                sub.handler(this, data.params, sub.userData);
                            } else if (this.callbacks.onEvent) {
                                this.callbacks.onEvent(this, data.params, sub.userData);
                            } else {
                                console.log('EVENT:', data.params);
                            }
                        });
                    }

                    break;
                }
                case 'verto.info':
                    if (this.callbacks.onMessage) {
                        this.callbacks.onMessage(this, null, this.enum.message.info, data.params.msg);
                    }
                    //console.error(data);
                    console.debug('MESSAGE from: ' + data.params.msg.from, data.params.msg.body);

                    break;

                default:
                    console.error('INVALID METHOD OR NON-EXISTANT CALL REFERENCE IGNORED', data.method);
                    break;
            }
        }
        return null;
    };
}

