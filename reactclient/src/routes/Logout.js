import React, {Component } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useHistory,
    useLocation
} from "react-router-dom";
import UserForm from '../UserForm';
import auth from "../auth/auth";
import { Message } from 'semantic-ui-react';

class Logout extends Component {
    constructor(props) {
        super(props);
        this.state = {}
        this.testLogoutListener = this.testLogoutListener.bind(this);
        
    }

    componentDidMount() {
    }

    // Temporary testing authorisation logout
    testLogoutListener(e) {
        e.preventDefault();
        
        auth.logout(
            (res) => {
                this.props.authMemoHandler();
                this.props.history.push('/login');
            }, (err) => {
                console.log(err);
            }
        ); 
    }

    render() {
        let history = this.props.history;
        let location = this.props.location;

        return (
            <div>
                <form style={{ textAlign: "center" }} onSubmit={this.testLogoutListener}>
                    <button>Logout</button>
                </form>
            </div>
        );
    }
    
}

export default Logout;