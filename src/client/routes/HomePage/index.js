import React, { PureComponent } from 'react';
import VertoAPI from './libs/VertoAPI';


export default class HomePage extends PureComponent {

    state = {
        src: null,
    };

    componentWillMount() {
        this.client = new VertoAPI({
            socketUrl: 'wss://fs1.vit.im:8082/',
            login: '1003@fs1.vit.im',
            passwd: 'VeRtO',
            permissionCallback: {
                onGranted: this.onLocalStream,
            },
            onRemoteStream: this.onRemoteStream,
            deviceParams: {
                useCamera: true,
                useMic: true,
            },
            useVideo: true,
        });
    }

    onLocalStream = (stream) => {
        this.setState({ src: URL.createObjectURL(stream) });
    };

    onRemoteStream = (stream) => {
        this.setState({ remote: URL.createObjectURL(stream) });
    };

    onCall = () => {
        this.client.newCall({
            destination_number: "1002",
            caller_id_name: "Test Guy",
            caller_id_number: "1003",
            outgoingBandwidth: "default",
            incomingBandwidth: "default",
            useStereo: true,
            useMic: true,
            useSpeak: true,
            dedEnc: false,
            userVariables: {
                avatar: "",
                email: "test@test.com"
            }
        });
    };

    render() {
        return (
            <div className="HomePage">
                <div>In</div>
                <video autoPlay style={{ width: '400px', height: '250px' }} src={this.state.src} />
                <div>Out</div>
                <video autoPlay style={{ width: '400px', height: '250px' }} src={this.state.remote} />
                <button onClick={this.onCall}>Call</button>
            </div>
        );
    }
}
