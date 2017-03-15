import React, { PureComponent, PropTypes } from 'react';
import { connect } from 'react-redux';
import Header from '../components/Header';


function mapStateToProps(state) {
    return {
        user: state.auth.user,
        logged: state.auth.logged,
    };
}


class HeaderContainer extends PureComponent {
    render() {
        return (
            <Header {...this.props} />
        );
    }
}


export default connect(mapStateToProps)(HeaderContainer);
