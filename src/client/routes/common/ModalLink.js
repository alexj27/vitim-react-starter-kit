import React, { PropTypes, Component } from 'react';
import { Link } from 'react-router';


export default class ModalLink extends Component {
    static propTypes = {
        modal: PropTypes.string.isRequired,
        children: PropTypes.any.isRequired,
        className: PropTypes.any,
        query: PropTypes.object,
    };

    static defaultProps = {
        className: '',
        query: {},
    };

    render() {
        const { modal, children, className, query } = this.props;

        return (
            <Link
                className={`ModalLink ${className}`}
                to={location => ({
                    ...location,
                    query: {
                        ...location.query,
                        ...query,
                        [modal]: location.query[modal] !== 'on' ? 'on' : 'off',
                    },
                })}
            >
                {children}
            </Link>
        );
    }
}
