import React, { Component } from 'react';
import { Link } from 'react-router';
import './Footer.less';


class Footer extends Component {

    render() {
        return (
            <footer className="Footer footer">
                <div className="container">
                    <span>Reach Live ©2017</span>
                    <Link to="/contents/faq">FAQ</Link>
                    <Link to="/contents/police">Police</Link>
                    <Link to="/contents/contact">Contact</Link>
                </div>
            </footer>
        );
    }
}


export default Footer;
