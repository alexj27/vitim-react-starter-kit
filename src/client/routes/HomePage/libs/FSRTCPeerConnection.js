//import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';
// import { onAnswerSDP } from './helpers';

const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection || window.msRTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.msRTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia;


export default class FSRTCPeerConnection {

    gathering = 0;
    done = false;
    x = 0;

    // DataChannel management
    channel = null;

    constructor(options) {
        this.options = options;
        const config = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };
        const defaultIce = [{ 'url': 'stun:stun.l.google.com:19302' }];

        if (options.iceServers) {
            if (typeof options.iceServers === 'boolean') {
                config.iceServers = [defaultIce];
            } else {
                config.iceServers = options.iceServers;
            }
        }
        this.peer = new RTCPeerConnection(config);
        this.peer.onicecandidate = this.onicecandidate;
        this.peer.onaddstream = this.onaddstream;
        this.peer.addStream(options.attachStream);

        if ((options.onChannelMessage) || !options.onChannelMessage) {
            this.createOffer();
            this.createAnswer();
        }

        this.openOffererChannel();
    }

    iceHandler = () => {
        this.done = true;
        this.gathering = null;

        if (this.options.onICEComplete) {
            this.options.onICEComplete();
        }

        if (this.options.type === 'offer') {
            this.options.onICESDP(this.peer.localDescription);
        } else if (!this.x && this.options.onICESDP) {
            this.options.onICESDP(this.peer.localDescription);
        }
    };

    serializeSdp = (sdp) => {
        return sdp;
    };

    onSdpSuccess = () => {
        console.log('sdp success:');
    };

    onSdpError = (e) => {
        if (this.options.onChannelError) {
            this.options.onChannelError(e);
        }
        console.log('sdp error:', e);
    };

    // onOfferSDP(RTCSessionDescription)
    createOffer = () => {
        if (!this.options.onOfferSDP) {
            return;
        }

        this.peer.createOffer(
            (sessionDescription) => {
                sessionDescription.sdp = this.serializeSdp(sessionDescription.sdp);
                this.peer.setLocalDescription(
                    sessionDescription,
                    this.onSdpSuccess,
                    this.onSdpError,
                    this.options.constraints
                );
                this.options.onOfferSDP(sessionDescription);
            },
            this.onSdpError,
            this.options.constraints
        );
    };

    // onAnswerSDP(RTCSessionDescription)
    createAnswer = () => {
        if (this.options.type !== 'answer') {
            return;
        }

        //options.offerSDP.sdp = addStereo(options.offerSDP.sdp);
        this.peer.setRemoteDescription(
            new RTCSessionDescription(this.options.offerSDP),
            this.onSdpSuccess,
            this.onSdpError,
        );

        this.peer.createAnswer(
            (sessionDescription) => {
                sessionDescription.sdp = this.serializeSdp(sessionDescription.sdp);
                this.peer.setLocalDescription(
                    sessionDescription,
                    this.onSdpSuccess,
                    this.onSdpError,
                    this.options.constraints,
                );
                if (this.options.onAnswerSDP) {
                    this.options.onAnswerSDP(sessionDescription);
                }
            },
            this.onSdpError
        );
    };


    onicecandidate = (event) => {
        if (this.done) {
            return;
        }

        if (!this.gathering) {
            this.gathering = setTimeout(this.iceHandler, 1000);
        }

        if (event) {
            if (event.candidate) {
                this.options.onICE(event.candidate);
            }
        } else {
            this.done = true;

            if (this.gathering) {
                clearTimeout(this.gathering);
                this.gathering = null;
            }

            this.iceHandler();
        }
    };

    onaddstream = (event) => {
        const remoteMediaStream = event.stream;

        // onRemoteStreamEnded(MediaStream)
        remoteMediaStream.oninactive = () => {
            if (this.options.onRemoteStreamEnded) {
                this.options.onRemoteStreamEnded(remoteMediaStream);
            }
        };

        // onRemoteStream(MediaStream)
        if (this.options.onRemoteStream) {
            this.options.onRemoteStream(remoteMediaStream);
        }

        console.debug('on:add:stream', remoteMediaStream);
    };

    // DataChannel Bandwidth
    setBandwidth = (sdp) => {
        // remove existing bandwidth lines
        sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
        sdp = sdp.replace(/a=mid:data\r\n/g, 'a=mid:data\r\nb=AS:1638400\r\n');

        return sdp;
    };

    // old: FF<>Chrome interoperability management
    getInteropSDP = (sdp) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        let extractedChars = '';

        function getChars() {
            extractedChars += chars[parseInt(Math.random() * 40, 10)] || '';
            if (extractedChars.length < 40) getChars();

            return extractedChars;
        }

        // usually audio-only streaming failure occurs out of audio-specific crypto line
        // a=crypto:1 AES_CM_128_HMAC_SHA1_32 --------- kAttributeCryptoVoice
        if (this.options.onAnswerSDP) sdp = sdp.replace(/(a=crypto:0 AES_CM_128_HMAC_SHA1_32)(.*?)(\r\n)/g, '');

        // video-specific crypto line i.e. SHA1_80
        // a=crypto:1 AES_CM_128_HMAC_SHA1_80 --------- kAttributeCryptoVideo
        const inline = getChars() + '\r\n' + (extractedChars = '');
        sdp = sdp.indexOf('a=crypto') === -1 ? sdp.replace(/c=IN/g, 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:' + inline + 'c=IN') : sdp;

        return sdp;
    };

    openOffererChannel = () => {
        if (!this.options.onChannelMessage) {
            return null;
        }

        this.channel = this.peer.createDataChannel(this.options.channel || 'RTCDataChannel', {
            reliable: false
        });

        this.setChannelEvents();

        return null;
    };

    setChannelEvents = () => {
        this.channel.onmessage = (event) => {
            if (this.options.onChannelMessage) {
                this.options.onChannelMessage(event);
            }
        };

        this.channel.onopen = () => {
            if (this.options.onChannelOpened) {
                this.options.onChannelOpened(this.channel);
            }
        };
        this.channel.onclose = (event) => {
            if (this.options.onChannelClosed) {
                this.options.onChannelClosed(event);
            }

            console.warn('WebRTC DataChannel closed', event);
        };
        this.channel.onerror = (event) => {
            if (this.options.onChannelError) {
                this.options.onChannelError(event);
            }

            console.error('WebRTC DataChannel error', event);
        };
    };

    openAnswererChannel = () => {
        this.peer.ondatachannel = (event) => {
            this.channel = event.channel;
            this.channel.binaryType = 'blob';
            this.setChannelEvents();
        };

        return null;
    };

    // fake:true is also available on chrome under a flag!
    useless = () => {
        console.log('Error in fake:true');
    };

    // publik interface
    addAnswerSDP = (sdp, cbSuccess, cbError) => {
        this.peer.setRemoteDescription(
            new RTCSessionDescription(sdp),
            cbSuccess || this.onSdpSuccess,
            cbError || this.onSdpError
        );
    };

    addICE = (candidate) => {
        this.peer.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: candidate.sdpMLineIndex,
            candidate: candidate.candidate
        }));
    };

    sendData = (message) => {
        if (this.channel) {
            this.channel.send(message);
        }
    };

    stop = () => {
        this.peer.close();
        if (this.options.attachStream) {
            if (typeof this.options.attachStream.stop === 'function') {
                this.options.attachStream.stop();
            }
        }
    };
}
