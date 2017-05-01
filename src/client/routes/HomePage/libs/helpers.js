//import RNGetUserMedia from 'react-native-webrtc/getUserMedia';
import uuid from 'react-native-uuid';


// Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
// and, if specified, contains |substr| (case-insensitive search).
export function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
    const realEndLine = (endLine !== -1) ? endLine : sdpLines.length;
    for (let i = startLine; i < realEndLine; i += 1) {
        if (sdpLines[i].indexOf(prefix) === 0) {
            if (!substr || sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
                return i;
            }
        }
    }
    return null;
}

// Gets the codec payload type from an a=rtpmap:X line.
export function getCodecPayloadType(sdpLine) {
    const pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
    const result = sdpLine.match(pattern);
    return (result && result.length === 2) ? result[1] : null;
}


// Returns a new m= line with the specified codec as the first one.
export function setDefaultCodec(mLine, payload) {
    const elements = mLine.split(' ');
    const newLine = [];
    let index = 0;
    for (let i = 0; i < elements.length; i += 1) {
        if (index === 3) { // Format of media starts from the fourth.
            index += 1;
            newLine[index] = payload; // Put target payload to the first.
        }
        if (elements[i] !== payload) {
            index += 1;
            newLine[index] = elements[i];
        }
    }
    return newLine.join(' ');
}


// Find the line in sdpLines that starts with |prefix|, and, if specified,
// contains |substr| (case-insensitive search).
export function findLine(sdpLines, prefix, substr) {
    return findLineInRange(sdpLines, 0, -1, prefix, substr);
}


export function setCompat() {
}

export function checkCompat() {
    return true;
}

export function doCallback(self, func, arg) {
    if (func in self.options.callbacks) {
        self.options.callbacks[func](self, arg);
    }
}

export function onICEComplete(self) {
    console.log('ICE Complete');
    doCallback(self, 'onICEComplete');
}

export function onChannelError(self, e) {
    console.error('Channel Error', e);
    doCallback(self, 'onError', e);
}

export function onICESDP(self, sdp) {
    self.mediaData.SDP = self.stereoHack(sdp.sdp);
    console.log('ICE SDP');
    doCallback(self, 'onICESDP');
}

export function onAnswerSDP(self, sdp) {
    self.answer.SDP = self.stereoHack(sdp.sdp);
    console.log('ICE ANSWER SDP');
    doCallback(self, 'onAnswerSDP', self.answer.SDP);
}

export function onMessage(self, msg) {
    console.log('Message');
    doCallback(self, 'onICESDP', msg);
}

export function onStreamError(self, e) {
    console.log('There has been a problem retrieving the streams - did you allow access? Check Device Resolution', e);
    doCallback(self, 'onError', e);
}

export function onStreamSuccess(self, stream) {
    console.log('Stream Success');
    doCallback(self, 'onStream', stream);
}

export function onICE(self, candidate) {
    self.mediaData.candidate = candidate;
    self.mediaData.candidateList.push(self.mediaData.candidate);

    doCallback(self, 'onICE');
}

export function onOfferSDP(self, sdp) {
    self.mediaData.SDP = self.stereoHack(sdp.sdp);
    console.log('Offer SDP');
    doCallback(self, 'onOfferSDP');
}


export function onRemoteStream(self, stream) {
    if (self.options.callbacks.onRemoteStream) {
        self.options.callbacks.onRemoteStream(stream);
    }

    console.log('REMOTE STREAM', stream);
}


// getUserMedia
const videoConstraints = {
    //mandatory: {},
    //optional: []
};

export function getUserMedia(options) {
    let media = null;

    function streaming(stream) {
        if (options.onSuccess) {
            options.onSuccess(stream);
        }

        media = stream;
    }

    function onError(error) {
        if (options.onError) {
            options.onError(error);
        }
    }

    media = navigator.getUserMedia(
        {
            audio: true,
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        },
        streaming,
        onError,
    );
    return media;
}


export function getMediaParams(obj) {
    let audio;
    let useVideo = obj.options.useVideo;

    if (obj.options.useMic && obj.options.useMic === 'none') {
        console.log('Microphone Disabled');
        audio = false;
    } else if (obj.options.videoParams && obj.options.screenShare) {
        //obj.options.videoParams.chromeMediaSource == 'desktop') {
        console.error('SCREEN SHARE', obj.options.videoParams);
        audio = false;
    } else {
        audio = {};

        if (obj.options.audioParams) {
            audio = obj.options.audioParams;
        }

        if (obj.options.useMic !== 'any') {
            //audio.optional = [{sourceId: obj.options.useMic}]
            audio.deviceId = { exact: obj.options.useMic };
        }
    }

    if (obj.options.useVideo && obj.options.localVideo) {
        getUserMedia({
            constraints: {
                audio: false,
                video: obj.options.videoParams

            },
            localVideo: obj.options.localVideo,
            onsuccess: (e) => {
                self.options.localVideoStream = e;
                console.log('local video ready');
            },
            onerror: () => {
                console.error('local video error!');
            }
        });
    }

    let video = {};
    const bestFrameRate = obj.options.videoParams.vertoBestFrameRate;
    const minFrameRate = obj.options.videoParams.minFrameRate || 15;
    delete obj.options.videoParams.vertoBestFrameRate;

    if (obj.options.screenShare) {
        // fix for chrome to work for now, will need to change once we figure out how to do this in a non-mandatory
        // style constraint.
        const opt = [];
        opt.push({ sourceId: obj.options.useCamera });

        if (bestFrameRate) {
            opt.push({ minFrameRate: bestFrameRate });
            opt.push({ maxFrameRate: bestFrameRate });
        }

        video = {
            mandatory: obj.options.videoParams,
            optional: opt
        };
    } else {
        video = {
            //mandatory: obj.options.videoParams,
            width: { min: obj.options.videoParams.minWidth, max: obj.options.videoParams.maxWidth },
            height: { min: obj.options.videoParams.minHeight, max: obj.options.videoParams.maxHeight }
        };

        if (useVideo && obj.options.useCamera && obj.options.useCamera !== 'none') {
            //if (!video.optional) {
            //video.optional = [];
            //}


            if (obj.options.useCamera !== 'any') {
                //video.optional.push({sourceId: obj.options.useCamera});
                video.deviceId = obj.options.useCamera;
            }

            if (bestFrameRate) {
                //video.optional.push({minFrameRate: bestFrameRate});
                //video.optional.push({maxFrameRate: bestFrameRate});
                video.frameRate = { ideal: bestFrameRate, min: minFrameRate, max: 30 };
            }
        } else {
            console.log('Camera Disabled');
            video = false;
            useVideo = false;
        }
    }

    return { audio, video, useVideo };
}


export function generateGUID() {
    return uuid.v4();
}
