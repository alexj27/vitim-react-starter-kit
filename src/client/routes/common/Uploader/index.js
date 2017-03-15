import React, { PureComponent, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Alert } from 'react-bootstrap';
import Uploader from './components/Uploader';
import { MAX_IMAGE_SIZE } from './constants';


class UploaderContainer extends PureComponent {
    static propTypes = {
        src: PropTypes.string.isRequired,
        onSave: PropTypes.func.isRequired,
    };

    state = {
        uploaded: null,
        cropped: null,
        original: null,
        error: null,
        uploading: false,
    };

    onCrop = () => {
        this.state.cropped = this.cropper.getData(true);
    };

    onError = (files) => {
        if (files && files.length > 0) {
            const [file] = files;
            if (file.size > MAX_IMAGE_SIZE) {
                this.setState({ error: 'Max image size 3MB.' });
            } else if ((file.type || '').indexOf('image') === -1) {
                this.setState({ error: 'Please choose a Image file' });
            } else {
                this.setState({ error: 'Not supported file' });
            }
        }
    };

    onChoiceFile = (files) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            this.setState({ uploaded: reader.result, original: files[0], error: null });
        };

        if (files && files.length > 0) {
            reader.readAsDataURL(files[0]);
        }
    };

    onSave = () => {
        this.setState({ uploading: true });
        return new Promise((resolve) => {
            this.cropper.getCroppedCanvas().toBlob(resolve);
        }).then((croppedImage) => {
            return this.props.onSave(
                this.state.original || this.props.src,
                croppedImage,
                this.cropper.getCroppedCanvas().toDataURL(),
            );
        }).then((data) => {
            this.setState({ uploading: false, original: null });
            return data;
        }).catch((error) => {
            this.setState({ error: error.message, uploading: false });
        });
    };

    setCropperRef = (com) => {
        this.cropper = com;
    };

    render() {
        const { src } = this.props;
        const { error } = this.state;

        return (
            <div>
                {
                    error &&
                    <Alert bsStyle="danger">
                        <strong>File error!</strong> {error}.
                    </Alert>
                }
                <Uploader
                    {...this.props}
                    {...this.state}
                    file={this.state.uploaded || src}
                    onCrop={this.onCrop}
                    onChange={this.onChoiceFile}
                    onSave={this.onSave}
                    onError={this.onError}
                    setCropperRef={this.setCropperRef}
                />
            </div>
        );
    }
}


export default connect()(UploaderContainer);
