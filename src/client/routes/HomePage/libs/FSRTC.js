import {
    findLine,
    setCompat,
    checkCompat,
    getCodecPayloadType,
    onICE,
    onICEComplete,
    onRemoteStream,
    onICESDP,
    onChannelError,
    onStreamSuccess,
    onStreamError,
    getMediaParams,
    getUserMedia,
    onOfferSDP,
} from './helpers';
import FSRTCPeerConnection from './FSRTCPeerConnection';


export default class FSRTC {
    static validRes = [];
    static resList = [[160, 120], [320, 180], [320, 240], [640, 360], [640, 480], [1280, 720], [1920, 1080]];
    static resI = 0;
    static ttl = 0;

    constructor(options) {
        this.options = {
            useVideo: true,
            useStereo: false,
            userData: null,
            localVideo: null,
            screenShare: false,
            useCamera: 'any',
            iceServers: false,
            videoParams: {},
            audioParams: {},
            callbacks: {
                onICEComplete: () => {
                },
                onICE: () => {
                },
                onOfferSDP: () => {
                }
            },
            ...options
        };
        this.audioEnabled = true;
        this.videoEnabled = true;

        this.mediaData = {
            SDP: null,
            profile: {},
            candidateList: []
        };

        this.constraints = {
            offerToReceiveAudio: this.options.useSpeak !== 'none',
            offerToReceiveVideo: !!this.options.useVideo,
        };

        setCompat();
        checkCompat();
    }

    useVideo = (obj, local) => {
        if (obj) {
            this.options.useVideo = obj;
            this.options.localVideo = local;
            this.constraints.offerToReceiveVideo = true;
        } else {
            this.options.useVideo = null;
            this.options.localVideo = null;
            this.constraints.offerToReceiveVideo = false;
        }
    };

    useStereo = (on) => {
        this.options.useStereo = on;
    };

    // Sets Opus in stereo if stereo is enabled, by adding the stereo=1 fmtp param.
    stereoHack = (sdp) => {
        if (!this.options.useStereo) {
            return sdp;
        }

        const sdpLines = sdp.split('\r\n');

        // Find opus payload.
        const opusIndex = findLine(sdpLines, 'a=rtpmap', 'opus/48000');
        let opusPayload;

        if (!opusIndex) {
            return sdp;
        } else {
            opusPayload = getCodecPayloadType(sdpLines[opusIndex]);
        }

        // Find the payload in fmtp line.
        const fmtpLineIndex = findLine(sdpLines, 'a=fmtp:' + opusPayload.toString());

        if (fmtpLineIndex === null) {
            // create an fmtp line
            sdpLines[opusIndex] = `${sdpLines[opusIndex]} \r\na=fmtp: ${opusPayload.toString()} stereo=1; sprop-stereo=1`;
        } else {
            // Append stereo=1 to fmtp line.
            sdpLines[fmtpLineIndex] = sdpLines[fmtpLineIndex].concat('; stereo=1; sprop-stereo=1');
        }

        sdp = sdpLines.join('\r\n');
        return sdp;
    };

    answer = (sdp, onSuccess, onError) => {
        this.peer.addAnswerSDP(
            {
                type: 'answer',
                sdp
            },
            onSuccess,
            onError
        );
    };

    stopPeer = () => {
        if (this.peer) {
            console.log('stopping peer');
            this.peer.stop();
        }
    };

    stop = () => {
        if (this.options.useVideo) {
            this.options.useVideo.style.display = 'none';
            this.options.useVideo.src = '';
        }

        if (this.localStream) {
            if (typeof this.localStream.stop === 'function') {
                this.localStream.stop();
            } else if (this.localStream.active) {
                const tracks = this.localStream.getTracks();
                console.log(tracks);
                tracks.forEach((track) => {
                    console.log(track);
                    track.stop();
                });
            }
            this.localStream = null;
        }

        if (this.options.localVideo) {
            this.options.localVideo.style.display = 'none';
            this.options.localVideo.src = '';
        }

        if (this.options.localVideoStream) {
            if (typeof this.options.localVideoStream.stop === 'function') {
                this.options.localVideoStream.stop();
            } else if (this.options.localVideoStream.active) {
                const tracks = this.options.localVideoStream.getTracks();
                console.log(tracks);
                tracks.forEach((track) => {
                    console.log(track);
                    track.stop();
                });
            }
        }

        if (this.peer) {
            console.log('stopping peer');
            this.peer.stop();
        }
    };

    getMute = () => {
        return this.audioEnabled;
    };

    setMute = (what) => {
        const audioTracks = this.localStream.getAudioTracks();

        for (let i = 0, len = audioTracks.length; i < len; i += 1) {
            switch (what) {
                case 'on':
                    audioTracks[i].enabled = true;
                    break;
                case 'off':
                    audioTracks[i].enabled = false;
                    break;
                case 'toggle':
                    audioTracks[i].enabled = !audioTracks[i].enabled;
                    break;
                default:
                    break;
            }

            this.audioEnabled = audioTracks[i].enabled;
        }

        return !this.audioEnabled;
    };

    getVideoMute = () => {
        return this.videoEnabled;
    };

    setVideoMute = (what) => {
        const videoTracks = this.localStream.getVideoTracks();

        for (let i = 0, len = videoTracks.length; i < len; i += 1) {
            switch (what) {
                case 'on':
                    videoTracks[i].enabled = true;
                    break;
                case 'off':
                    videoTracks[i].enabled = false;
                    break;
                case 'toggle':
                    videoTracks[i].enabled = !videoTracks[i].enabled;
                    break;
                default:
                    break;
            }

            this.videoEnabled = videoTracks[i].enabled;
        }

        return !this.videoEnabled;
    };

    createAnswer = (params) => {
        this.type = 'answer';
        this.remoteSDP = params.sdp;
        console.debug('inbound sdp: ', params.sdp);

        function onSuccess(stream) {
            this.localStream = stream;

            this.peer = new FSRTCPeerConnection({
                type: this.type,
                attachStream: this.localStream,
                onICE: (candidate) => {
                    return onICE(this, candidate);
                },
                onICEComplete: () => {
                    return onICEComplete(this);
                },
                onRemoteStream: (remoteStream) => {
                    return onRemoteStream(this, remoteStream);
                },
                onICESDP: (sdp) => {
                    return onICESDP(this, sdp);
                },
                onChannelError: (e) => {
                    return onChannelError(this, e);
                },
                constraints: this.constraints,
                iceServers: this.options.iceServers,
                offerSDP: {
                    type: 'offer',
                    sdp: this.remoteSDP
                }
            });

            onStreamSuccess(this, stream);
        }

        function onError(e) {
            onStreamError(this, e);
        }

        const mediaParams = getMediaParams(this);

        console.log('Audio constraints', mediaParams.audio);
        console.log('Video constraints', mediaParams.video);

        if (this.options.useVideo && this.options.localVideo) {
            getUserMedia({
                constraints: {
                    audio: false,
                    video: {
                        //mandatory: this.options.videoParams,
                        //optional: []
                    },
                },
                localVideo: this.options.localVideo,
                onsuccess: (e) => {
                    this.options.localVideoStream = e;
                    console.log('local video ready');
                },
                onerror: (e) => {
                    console.error('local video error!', e);
                }
            });
        }

        getUserMedia({
            constraints: {
                audio: mediaParams.audio,
                video: mediaParams.video
            },
            video: mediaParams.useVideo,
            onSuccess,
            onError
        });
    };

    call = () => {
        checkCompat();
        let screen = false;

        this.type = 'offer';

        if (this.options.videoParams && this.options.screenShare) {
            //this.options.videoParams.chromeMediaSource == 'desktop') {
            screen = true;
        }

        const onSuccess = (stream) => {
            this.localStream = stream;

            if (screen) {
                this.constraints.offerToReceiveVideo = false;
            }

            this.peer = new FSRTCPeerConnection({
                type: this.type,
                attachStream: this.localStream,
                onICE: (candidate) => {
                    return onICE(this, candidate);
                },
                onICEComplete: () => {
                    return onICEComplete(this);
                },
                onRemoteStream: remoteStream => {
                    onRemoteStream(this, remoteStream)
                },
                onOfferSDP: (sdp) => {
                    return onOfferSDP(this, sdp);
                },
                onICESDP: (sdp) => {
                    return onICESDP(this, sdp);
                },
                onChannelError: (e) => {
                    return onChannelError(this, e);
                },
                constraints: this.constraints,
                iceServers: this.options.iceServers,
            });

            onStreamSuccess(this, stream);
        };

        const onError = (e) => {
            onStreamError(this, e);
        };

        const mediaParams = getMediaParams(this);

        console.log('Audio constraints', mediaParams.audio);
        console.log('Video constraints', mediaParams.video);

        if (mediaParams.audio || mediaParams.video) {
            getUserMedia({
                constraints: {
                    audio: mediaParams.audio,
                    video: mediaParams.video
                },
                video: mediaParams.useVideo,
                onSuccess,
                onError,
            });
        } else {
            onSuccess(null);
        }
    };

    resSupported = (w, h) => {
        for (let i = 0; i < this.validRes.length; i += 1) {
            if (this.validRes[i][0] === w && this.validRes[i][1] === h) {
                return true;
            }
        }

        return false;
    };

    static bestResSupported = () => {
        let w = 0;
        let h = 0;

        FSRTC.validRes.forEach((resource) => {
            const [width, height] = resource;

            if (width >= w && height >= h) {
                w = width;
                h = height;
                return false;
            }
            return true;
        });
        return [w, h];
    };

    static checkRes = (cam, func, isFront = true) => {
        if (FSRTC.resI >= FSRTC.resList.length) {
            const res = {
                'validRes': FSRTC.validRes,
                'bestResSupported': FSRTC.bestResSupported()
            };

            if (func) {
                return func(res);
            }
            return null;
        }
        const [w, h] = FSRTC.resList[FSRTC.resI];

        FSRTC.resI += 1;

        const video = {
            mandatory: {
                minWidth: w,
                minHeight: h,
                minFrameRate: 25
            }
        };

        getUserMedia({
            constraints: {
                audio: FSRTC.ttl,
                video,
                facingMode: (isFront ? 'user' : 'environment'),
            },
            onSuccess: (e) => {
                e.getTracks().forEach((track) => {
                    track.stop();
                });
                console.log(w + 'x' + h + ' supported.');
                FSRTC.validRes.push([w, h]);
                FSRTC.checkRes(cam, func);
            },
            onError: (e) => {
                console.log(w + 'x' + h + 'not supported.', e);
                FSRTC.checkRes(cam, func);
            }
        });
        FSRTC.ttl += 1;
        return null;
    };

    static getValidRes = (cam, func) => {
        FSRTC.checkRes(cam, func);
    };

    static checkPerms = (runtime, checkAudio, checkVideo) => {
        getUserMedia({
            constraints: {
                audio: checkAudio,
                video: checkVideo,
                facingMode: 'environment',
            },
            onsuccess: (e) => {
                e.getTracks().forEach((track) => {
                    track.stop();
                });

                console.info('media perm init complete');
                if (runtime) {
                    setTimeout(runtime, 100, true);
                }
            },
            onerror: (e) => {
                if (checkVideo && checkAudio) {
                    console.error('error, retesting with audio params only', e);
                    return this.checkPerms(runtime, checkAudio, false);
                }

                console.error('media perm init error');

                if (runtime) {
                    runtime(false);
                }
                return null;
            }
        });
    }
}
