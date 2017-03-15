import React, { PropTypes } from 'react';
import DropZone from 'react-dropzone';
import cn from 'classnames';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import logoPNG from '../../../../assets/img/icon/logo.png';
import './Uploader.less';
import { MAX_IMAGE_SIZE } from '../../constants';


export default function Uploader(props) {
    const { file, onChange, onCrop, onSave, onError, aspectRatio, width, height, setCropperRef, inline, uploading } = props;
    return (
        <div className={cn('Uploader', { 'Uploader--inline': inline })}>
            <Cropper
                ref={setCropperRef}
                className="Uploader-image "
                src={file || logoPNG}
                style={{ width, height }}
                aspectRatio={aspectRatio}
                checkCrossOrigin
                guides={false}
                dragMode="move"
                crop={onCrop}
            />

            <div className="Uploader--controls">
                <DropZone
                    maxSize={MAX_IMAGE_SIZE}
                    className="Uploader-uploadBtn"
                    onDrop={onChange}
                    onDropRejected={onError}
                    onChange={onChange}
                    accept="image/*"
                >
                    <button className="btn btn-success">Upload</button>
                </DropZone>
                {
                    file &&
                    <button onClick={onSave} disabled={uploading} className="btn btn-default">
                        { uploading && <i className="fa fa-spinner fa-pulse fa-fw" />} Save
                    </button>
                }
            </div>
        </div>
    );
}


Uploader.propTypes = {
    file: PropTypes.string,
    uploading: PropTypes.bool,
    aspectRatio: PropTypes.number,
    width: PropTypes.any.isRequired,
    height: PropTypes.number.isRequired,
    inline: PropTypes.bool,
    onSave: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onCrop: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    setCropperRef: PropTypes.func.isRequired,
};


Uploader.defaultProps = {
    file: null,
    inline: false,
    uploading: false,
    aspectRatio: null,
};
