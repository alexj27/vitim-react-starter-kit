import React, { PureComponent, PropTypes } from 'react';
import { Modal } from 'react-bootstrap';
import { withRouter } from 'react-router';
import logoPng from '../../assets/img/icon/logo.png';
import './ModalWindow.less';


@withRouter
class ModalWindow extends PureComponent {
    static propTypes = {
        title: PropTypes.string.isRequired,
        children: PropTypes.object.isRequired,
        modalName: PropTypes.string.isRequired,
        router: PropTypes.object.isRequired,
        extraField: PropTypes.object,
        onClose: PropTypes.func,
        bsSize: PropTypes.string,
    };

    static defaultProps = {
        extraField: {},
        bsSize: null,
        onClose: () => ({}),
    };

    onClose = (e) => {
        const { modalName, extraField, onClose, router: { location, replace } } = this.props;
        const { query } = location;
        delete query[modalName];

        Object.keys(extraField).forEach((key) => {
            delete query[key];
        });

        replace({
            ...location,
            query
        });
        onClose(e);
    };

    render() {
        const { modalName, title, children, router, bsSize } = this.props;
        const { location: { query } } = router;

        return (
            <Modal bsSize={bsSize} className="ModalWindow" show={query[modalName] === 'on'} onHide={this.onClose}>
                <Modal.Header>
                    <img src={logoPng} alt={title} />
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {React.cloneElement(children, { router, onClose: this.onClose })}
                </Modal.Body>
            </Modal>
        );
    }
}


export default ModalWindow;
