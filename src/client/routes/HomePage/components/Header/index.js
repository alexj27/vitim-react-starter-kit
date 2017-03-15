import React, { PureComponent, PropTypes } from 'react';
import './Header.less';


export default class Header extends PureComponent {
    static propTypes = {
        user: PropTypes.object.isRequired,
    };

    render() {
        const { user: { theme: { headerBackground } } } = this.props;
        const style = {
            backgroundImage: `url(${headerBackground})`,
        };

        return (
            <div className="Header">
                <div className="Header-content" style={style}>
                    Header ertr
                </div>
            </div>
        );
    }
}
