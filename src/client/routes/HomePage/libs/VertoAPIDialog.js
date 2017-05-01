import FSRTC from './FSRTC';
import {
    generateGUID
} from './helpers';


export default class VertoAPIDialog {
    constructor(direction, verto, params) {
        this.params = {
            useVideo: verto.options.useVideo,
            useStereo: verto.options.useStereo,
            screenShare: false,
            useCamera: verto.options.deviceParams.useCamera,
            useMic: verto.options.deviceParams.useMic,
            useSpeak: verto.options.deviceParams.useSpeak,
            login: verto.options.login,
            videoParams: verto.options.videoParams,
            ...params
        };

        this.verto = verto;
        this.direction = direction;
        this.lastState = this.verto.enumerator.state.new;
        this.state = this.lastState;
        this.callbacks = verto.callbacks;
        this.answered = false;
        this.attach = params.attach || false;
        this.screenShare = params.screenShare || false;
        this.useCamera = this.params.useCamera;
        this.useMic = this.params.useMic;
        this.useSpeak = this.params.useSpeak;

        if (this.params.callID) {
            this.callID = this.params.callID;
        } else {
            this.callID = generateGUID();
            this.params.callID = this.callID;
        }

        this.verto.dialogs[this.callID] = this;

        const RTCallbacks = {};

        if (this.direction === this.verto.enumerator.direction.inbound) {
            if (this.params.display_direction === 'outbound') {
                this.params.remote_caller_id_name = this.params.caller_id_name;
                this.params.remote_caller_id_number = this.params.caller_id_number;
            } else {
                this.params.remote_caller_id_name = this.params.callee_id_name;
                this.params.remote_caller_id_number = this.params.callee_id_number;
            }

            if (!this.params.remote_caller_id_name) {
                this.params.remote_caller_id_name = 'Nobody';
            }

            if (!this.params.remote_caller_id_number) {
                this.params.remote_caller_id_number = 'UNKNOWN';
            }

            RTCallbacks.onMessage = (rtc, msg) => {
                console.debug(msg);
            };

            RTCallbacks.onAnswerSDP = (rtc, sdp) => {
                console.error('answer sdp', sdp);
            };
        } else {
            this.params.remote_caller_id_name = 'Outbound Call';
            this.params.remote_caller_id_number = this.params.destination_number;
        }

        RTCallbacks.onICESDP = (rtc) => {
            console.log('RECV ' + rtc.type + ' SDP', rtc.mediaData.SDP);

            if (this.state === this.verto.enumerator.state.requesting
                || this.state === this.verto.enumerator.state.answering
                || this.state === this.verto.enumerator.state.active) {
                location.reload();
                return;
            }

            if (rtc.type === 'offer') {
                if (this.state === this.verto.enumerator.state.active) {
                    this.setState(this.verto.enumerator.state.requesting);
                    this.sendMethod('verto.attach', {
                        sdp: rtc.mediaData.SDP
                    });
                } else {
                    this.setState(this.verto.enumerator.state.requesting);

                    this.sendMethod('verto.invite', {
                        sdp: rtc.mediaData.SDP
                    });
                }
            } else { //answer
                this.setState(this.verto.enumerator.state.answering);

                this.sendMethod(this.attach ? 'verto.attach' : 'verto.answer', {
                    sdp: this.rtc.mediaData.SDP
                });
            }
        };

        RTCallbacks.onICE = (rtc) => {
            //console.log('cand', rtc.mediaData.candidate);
            if (rtc.type === 'offer') {
                console.log('offer', rtc.mediaData.candidate);
            }
        };

        RTCallbacks.onStream = (rtc, stream) => {
            if (this.verto.options.permissionCallback &&
                typeof this.verto.options.permissionCallback.onGranted === 'function') {
                this.verto.options.permissionCallback.onGranted(stream);
            }
            console.log('stream started');
        };

        RTCallbacks.onError = (e) => {
            if (this.verto.options.permissionCallback &&
                typeof this.verto.options.permissionCallback.onDenied === 'function') {
                this.verto.options.permissionCallback.onDenied();
            }
            console.error('ERROR:', e);
            this.hangup({ cause: 'Device or Permission Error' });
        };

        RTCallbacks.onRemoteStream = (stream) => {
            if (this.verto.options.onRemoteStream && typeof this.verto.options.onRemoteStream === 'function') {
                this.verto.options.onRemoteStream(stream);
            }
        };

        this.rtc = new FSRTC({
            callbacks: RTCallbacks,
            localVideo: this.screenShare ? null : this.localVideo,
            useVideo: this.params.useVideo,
            useAudio: this.audioStream,
            useStereo: this.params.useStereo,
            videoParams: this.params.videoParams,
            audioParams: verto.options.audioParams,
            iceServers: verto.options.iceServers,
            screenShare: this.screenShare,
            useCamera: this.useCamera,
            useMic: this.useMic,
            useSpeak: this.useSpeak
        });

        this.rtc.verto = this.verto;

        if (this.direction === this.verto.enumerator.direction.inbound) {
            if (this.attach) {
                this.answer();
            } else {
                this.ring();
            }
        }
    }

    invite = () => {
        this.rtc.call();
    };

    sendMethod = (method, obj) => {
        obj.dialogParams = {};
        Object.keys(this.params).forEach((key) => {
            const eq1 = key === 'sdp' && method !== 'verto.invite' && method !== 'verto.attach';
            const eq2 = obj.nothisParams && key !== 'callID';

            if (!(eq1 || eq2)) {
                obj.dialogParams[key] = this.params[key];
            }
        });

        delete obj.nothisParams;

        this.verto.rpcClient.call(method, obj,
            (e) => {
                /* Success */
                this.processReply(method, true, e);
            },
            (e) => {
                /* Error */
                this.processReply(method, false, e);
            });
    };

    checkStateChange = (oldS, newS) => {
        if (newS === this.verto.enumerator.state.purge || this.verto.enumerator.states[oldS.name][newS.name]) {
            return true;
        }

        return false;
    };

    // Attach audio output device to video element using device/sink ID.
    findName = (id) => {
        let newId = id;
        Object.keys(this.verto.audioOutDevices).forEach((key) => {
            const source = this.verto.audioOutDevices[key];

            if (source.id === id) {
                newId = source.label;
                return false;
            }
            return true;
        });

        return newId;
    };

    setAudioPlaybackDevice = (sinkId, callback, arg) => {
        const element = this.audioStream || {};

        if (typeof element.sinkId !== 'undefined') {
            const devname = this.findName(sinkId);
            console.info('this: ' + this.callID + ' Setting speaker:', element, devname);

            element.setSinkId(sinkId)
                .then(() => {
                    console.log('this: ' + this.callID + ' Success, audio output device attached: ' + sinkId);
                    if (callback) {
                        callback(true, devname, arg);
                    }
                })
                .catch((error) => {
                    let errorMessage = error;
                    if (error.name === 'SecurityError') {
                        errorMessage = 'this: ' + this.callID + ' You need to use HTTPS for selecting audio output ' +
                            'device: ' + error;
                    }
                    if (callback) {
                        callback(false, null, arg);
                    }
                    console.warning(errorMessage);
                });
        } else {
            console.warn('this: ' + this.callID + ' Browser does not support output device selection.');
            if (callback) {
                callback(false, null, arg);
            }
        }
    };

    setState = (state) => {
        if (this.state === this.verto.enumerator.state.ringing) {
            this.stopRinging();
        }

        if (this.state === state || !this.checkStateChange(this.state, state)) {
            console.error('this ' + this.callID + ': INVALID state change from ' + this.state.name + ' to ' + state.name);
            this.hangup();
            return false;
        }

        console.log('this ' + this.callID + ': state change from ' + this.state.name + ' to ' + state.name);

        this.lastState = this.state;
        this.state = state;

        if (!this.causeCode) {
            this.causeCode = 16;
        }

        if (!this.cause) {
            this.cause = 'NORMAL CLEARING';
        }

        if (this.callbacks.onthisState) {
            this.callbacks.onthisState(this);
        }

        switch (this.state) {
            case this.verto.enumerator.state.early:
            case this.verto.enumerator.state.active: {
                const speaker = this.useSpeak;
                console.info('Using Speaker: ', speaker);

                if (speaker && speaker !== 'any' && speaker !== 'none') {
                    setTimeout(() => {
                        this.setAudioPlaybackDevice(speaker);
                    }, 500);
                }

                break;
            }
            case this.verto.enumerator.state.trying:
                setTimeout(() => {
                    if (this.state === this.verto.enumerator.state.trying) {
                        this.setState(this.verto.enumerator.state.hangup);
                    }
                }, 30000);
                break;
            case this.verto.enumerator.state.purge:
                this.setState(this.verto.enumerator.state.destroy);
                break;
            case this.verto.enumerator.state.hangup:

                if (this.lastState.val > this.verto.enumerator.state.requesting.val && this.lastState.val < this.verto.enumerator.state.hangup.val) {
                    this.sendMethod('verto.bye', {});
                }

                this.setState(this.verto.enumerator.state.destroy);
                break;
            case this.verto.enumerator.state.destroy:
                delete this.verto.dialogs[this.callID];
                if (this.params.screenShare) {
                    this.rtc.stopPeer();
                } else {
                    this.rtc.stop();
                }
                break;
            default:
                break;
        }

        return true;
    };

    processReply = (method, success, e) => {
        //console.log('Response: ' + method + ' State:' + this.state.name, success, e);

        switch (method) {
            case 'verto.answer':
            case 'verto.attach':
                if (success) {
                    this.setState(this.verto.enumerator.state.active);
                } else {
                    this.hangup();
                }
                break;
            case 'verto.invite':
                if (success) {
                    this.setState(this.verto.enumerator.state.trying);
                } else {
                    this.setState(this.verto.enumerator.state.destroy);
                }
                break;

            case 'verto.bye':
                this.hangup();
                break;

            case 'verto.modify':
                if (e.holdState) {
                    if (e.holdState === 'held') {
                        if (this.state !== this.verto.enumerator.state.held) {
                            this.setState(this.verto.enumerator.state.held);
                        }
                    } else if (e.holdState === 'active') {
                        if (this.state !== this.verto.enumerator.state.active) {
                            this.setState(this.verto.enumerator.state.active);
                        }
                    }
                }
                break;
            default:
                break;
        }
    };

    hangup = (params) => {
        if (params) {
            if (params.causeCode) {
                this.causeCode = params.causeCode;
            }

            if (params.cause) {
                this.cause = params.cause;
            }
        }

        if (this.state.val >= this.verto.enumerator.state.new.val && this.state.val < this.verto.enumerator.state.hangup.val) {
            this.setState(this.verto.enumerator.state.hangup);
        } else if (this.state.val < this.verto.enumerator.state.destroy) {
            this.setState(this.verto.enumerator.state.destroy);
        }
    };

    stopRinging = () => {
        if (this.verto.ringer) {
            this.verto.ringer.stop();
        }
    };

    indicateRing = () => {
        if (this.verto.ringer) {
            this.verto.ringer.attr('src', this.verto.options.ringFile)[0].play();

            setTimeout(
                () => {
                    this.stopRinging();
                    if (this.state === this.verto.enumerator.state.ringing) {
                        this.indicateRing();
                    }
                },
                this.verto.options.ringSleep
            );
        }
    };

    ring = () => {
        this.setState(this.verto.enumerator.state.ringing);
        this.indicateRing();
    };

    useVideo = (on) => {
        this.params.useVideo = on;

        if (on) {
            this.videoStream = this.audioStream;
        } else {
            this.videoStream = null;
        }

        this.rtc.useVideo(this.videoStream, this.localVideo);
    };

    setMute = (what) => {
        return this.rtc.setMute(what);
    };

    getMute = () => {
        return this.rtc.getMute();
    };

    setVideoMute = (what) => {
        return this.rtc.setVideoMute(what);
    };

    getVideoMute = () => {
        return this.rtc.getVideoMute();
    };

    useStereo = (on) => {
        this.params.useStereo = on;
        this.rtc.useStereo(on);
    };

    dtmf = (digits) => {
        if (digits) {
            this.sendMethod('verto.info', {
                dtmf: digits
            });
        }
    };

    rtt = (obj) => {
        const pobj = {};

        if (!obj) {
            return;
        }

        pobj.code = obj.code;
        pobj.chars = obj.chars;

        if (pobj.chars || pobj.code) {
            this.sendMethod('verto.info', {
                txt: obj,
                nothisParams: true
            });
        }
    };

    transfer = (dest, params) => {
        if (dest) {
            this.sendMethod('verto.modify', {
                action: 'transfer',
                destination: dest,
                params,
            });
        }
    };

    hold = (params) => {
        this.sendMethod('verto.modify', {
            action: 'hold',
            params,
        });
    };

    unhold = (params) => {
        this.sendMethod('verto.modify', {
            action: 'unhold',
            params,
        });
    };

    toggleHold = (params) => {
        this.sendMethod('verto.modify', {
            action: 'toggleHold',
            params,
        });
    };

    message = (msg) => {
        let err = 0;

        msg.from = this.params.login;

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

        this.sendMethod('verto.info', {
            msg
        });

        return true;
    };

    answer = (params) => {
        if (!this.answered) {
            if (!params) {
                params = {};
            }

            params.sdp = this.params.sdp;

            if (params) {
                if (params.useVideo) {
                    this.useVideo(true);
                }
                this.params.callee_id_name = params.callee_id_name;
                this.params.callee_id_number = params.callee_id_number;

                if (params.useCamera) {
                    this.useCamera = params.useCamera;
                }

                if (params.useMic) {
                    this.useMic = params.useMic;
                }

                if (params.useSpeak) {
                    this.useSpeak = params.useSpeak;
                }
            }

            this.rtc.createAnswer(params);
            this.answered = true;
        }
    };

    handleAnswer = (params) => {
        this.gotAnswer = true;

        if (this.state.val >= this.verto.enumerator.state.active.val) {
            return;
        }

        if (this.state.val >= this.verto.enumerator.state.early.val) {
            this.setState(this.verto.enumerator.state.active);
        } else if (this.gotEarly) {
            console.log('this ' + this.callID + ' Got answer while still establishing early media, delaying...');
        } else {
            console.log('this ' + this.callID + ' Answering Channel');
            this.rtc.answer(params.sdp, () => {
                this.setState(this.verto.enumerator.state.active);
            }, (e) => {
                console.error(e);
                this.hangup();
            });
            console.log('this ' + this.callID + 'ANSWER SDP', params.sdp);
        }
    };

    cidString = (enc) => {
        const party = this.params.remote_caller_id_name + (enc ? ' &lt;' : ' <') + this.params.remote_caller_id_number + (enc ? '&gt;' : '>');
        return party;
    };

    sendMessage = (msg, params) => {
        if (this.callbacks.onMessage) {
            this.callbacks.onMessage(this.verto, this, msg, params);
        }
    };

    handleInfo = (params) => {
        this.sendMessage(this.verto.enumerator.message.info, params);
    };

    handleDisplay = (params) => {
        if (params.display_name) {
            this.params.remote_caller_id_name = params.display_name;
        }
        if (params.display_number) {
            this.params.remote_caller_id_number = params.display_number;
        }

        this.sendMessage(this.verto.enumerator.message.display, {});
    };

    handleMedia = (params) => {
        if (this.state.val >= this.verto.enumerator.state.early.val) {
            return;
        }

        this.gotEarly = true;

        this.rtc.answer(params.sdp, () => {
            console.log('this ' + this.callID + 'Establishing early media');
            this.setState(this.verto.enumerator.state.early);

            if (this.gotAnswer) {
                console.log('this ' + this.callID + 'Answering Channel');
                this.setState(this.verto.enumerator.state.active);
            }
        }, (e) => {
            console.error(e);
            this.hangup();
        });
        console.log('this ' + this.callID + 'EARLY SDP', params.sdp);
    };
}
