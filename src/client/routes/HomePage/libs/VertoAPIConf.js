const CONFMAN_SERNO = 1;


export default class VertoAPIDialog {
    destroyed = false;

    constructor(verto, params) {
        this.verto = verto;
        this.params = {
            dialog: null,
            hasVid: false,
            laData: null,
            onBroadcast: null,
            onLaChange: null,
            onLaRow: null,
            ...params
        };
        this.serno = CONFMAN_SERNO + 1;

        verto.subscribe(params.laData.modChannel, {
            handler: (v, e) => {
                if (params.onBroadcast) {
                    params.onBroadcast(verto, this, e.data);
                }
            }
        });

        verto.subscribe(params.laData.infoChannel, {
            handler: (v, e) => {
                if (typeof params.infoCallback === 'function') {
                    params.infoCallback(v, e);
                }
            }
        });

        verto.subscribe(params.laData.chatChannel, {
            handler: (v, e) => {
                if (typeof params.chatCallback === 'function') {
                    params.chatCallback(v, e);
                }
            }
        });
    }

    modCommand = (cmd, id, value) => {
        const { params, verto } = this;

        verto.rpcClient.call('verto.broadcast', {
            'eventChannel': params.laData.modChannel,
            'data': {
                'application': 'conf-control',
                'command': cmd,
                'id': id,
                'value': value
            }
        });
    };

    destroy = () => {
        const { params, verto } = this;
        this.destroyed = true;

        params.onBroadcast(verto, this, 'destroy');

        if (params.laData.modChannel) {
            verto.unsubscribe(params.laData.modChannel);
        }

        if (params.laData.chatChannel) {
            verto.unsubscribe(params.laData.chatChannel);
        }

        if (params.laData.infoChannel) {
            verto.unsubscribe(params.laData.infoChannel);
        }
    };


    listVideoLayouts = () => {
        this.modCommand('list-videoLayouts', null, null);
    };

    play = (file) => {
        this.modCommand('play', null, file);
    };

    stop = () => {
        this.modCommand('stop', null, 'all');
    };

    deaf = (memberID) => {
        this.modCommand('deaf', parseInt(memberID, 10));
    };

    undeaf = (memberID) => {
        this.modCommand('undeaf', parseInt(memberID, 10));
    };

    record = (file) => {
        this.modCommand('recording', null, ['start', file]);
    };

    stopRecord = () => {
        this.modCommand('recording', null, ['stop', 'all']);
    };

    snapshot = (file) => {
        if (!this.params.hasVid) {
            throw new Error('Conference has no video');
        }
        this.modCommand('vid-write-png', null, file);
    };

    setVideoLayout = (layout, canvasID) => {
        if (!this.params.hasVid) {
            throw new Error('Conference has no video');
        }
        if (canvasID) {
            this.modCommand('vid-layout', null, [layout, canvasID]);
        } else {
            this.modCommand('vid-layout', null, layout);
        }
    };

    kick = (memberID) => {
        this.modCommand('kick', parseInt(memberID, 10));
    };

    muteMic = (memberID) => {
        this.modCommand('tmute', parseInt(memberID, 10));
    };

    muteVideo = (memberID) => {
        if (!this.params.hasVid) {
            throw new Error('Conference has no video');
        }
        this.modCommand('tvmute', parseInt(memberID, 10));
    };

    presenter = (memberID) => {
        if (!this.params.hasVid) {
            throw new Error('Conference has no video');
        }
        this.modCommand('vid-res-id', parseInt(memberID, 10), 'presenter');
    };

    videoFloor = (memberID) => {
        if (!this.params.hasVid) {
            throw new Error('Conference has no video');
        }
        this.modCommand('vid-floor', parseInt(memberID, 10), 'force');
    };

    banner = (memberID, text) => {
        if (!this.params.hasVid) {
            throw new Error('Conference has no video');
        }
        this.modCommand('vid-banner', parseInt(memberID, 10), escape(text));
    };

    volumeDown = (memberID) => {
        this.modCommand('volume_out', parseInt(memberID, 10), 'down');
    };

    volumeUp = (memberID) => {
        this.modCommand('volume_out', parseInt(memberID, 10), 'up');
    };

    gainDown = (memberID) => {
        this.modCommand('volume_in', parseInt(memberID, 10), 'down');
    };

    gainUp = (memberID) => {
        this.modCommand('volume_in', parseInt(memberID, 10), 'up');
    };

    transfer = (memberID, exten) => {
        this.modCommand('transfer', parseInt(memberID, 10), exten);
    };

    sendChat = (message, type) => {
        const { params, verto } = this;

        verto.rpcClient.call('verto.broadcast', {
            'eventChannel': params.laData.chatChannel,
            'data': {
                'action': 'send',
                'message': message,
                'type': type
            }
        });
    };
}

