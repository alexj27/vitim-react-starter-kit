import React, { Component, PropTypes } from 'react';

export { default as Contact } from './components/Contact';
export { default as FAQ } from './components/FAQ';
export { default as Police } from './components/Police';


class ContentPage extends Component {
    static propTypes = {
        children: PropTypes.object.isRequired,
    };

    render() {
        const { children } = this.props;

        return (
            <div className="ContentPage container">
                {children}
            </div>
        );
    }
}


export default ContentPage;
