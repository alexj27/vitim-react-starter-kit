import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';
import auth from './auth';
import { signals, webrtc } from '../../Libs/WebRtcVIew';


export default combineReducers({
    form: formReducer,
    auth,
    signals,
    webrtc,
});

