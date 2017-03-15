import { connect } from 'react-redux';
import Header from '../components/Header';


function mapStateToProps(state) {
    return {
        user: state.auth.user,
        logged: state.auth.logged,
    };
}


export default connect(mapStateToProps)(Header);
