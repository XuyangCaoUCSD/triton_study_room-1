import React, {Component } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";
import UserForm from '../UserForm';
import auth from "../auth/auth";
import { Message } from 'semantic-ui-react';

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {}
        this.getUser = this.getUser.bind(this);
        this.testLogoutListener = this.testLogoutListener.bind(this);
        this.googleLogInHandler = this.googleLogInHandler.bind(this);
    }

    componentDidMount() {
    }

    getUser = (e) => {
        e.preventDefault();
        const username = e.target.elements.username.value; // Extract submitted text in input in UserForm
        const password = e.target.elements.password.value;

        const data = {
            username,
            password
        }

        auth.login(data, 
            (res) => {
                this.props.history.push("/dashboard");
            }, (err) => {
                console.log(err);
            }   
        );
    }

    // Temporary testing authorisation logout
    testLogoutListener(e) {
        e.preventDefault();

        auth.logout(
            (res) => {
            this.props.history.push('/');
            }, (err) => {
                console.log(err);
            }
        );
    }

    googleLogInHandler (e) {
        e.preventDefault(); // needed to prevent form from refreshing page
        auth.googleLogin(
            (res) => {
                this.props.history.push("/dashboard");
            }, (err) => {
                console.log(err);
            }
        );
    }

    render () {
        // Display not logged in error if redirected from dashboard (maybe as not using valid ucsd email)
        let redirectedFromGoogle = false;
        if (window.location.toString().includes('#')) {
            redirectedFromGoogle = true;
        }
        let errorDisplay = 
            (redirectedFromGoogle || (this.props.location.state && this.props.location.state.error)) ? 
            <Message negative>
                <Message.Header>Login Error</Message.Header>
                <p>{"Please use a valid UCSD email to log in!"}</p>
            </Message> : 
            "";
        
        return (
            <div>
                {errorDisplay}
                <h2>Login</h2>
                <form style={{ textAlign: "center" }} onSubmit={this.googleLogInHandler}>
                    <button>GOOGLE LOGIN</button>
                </form>
                <UserForm getUser={this.getUser} />

                <p></p>
                <form style={{ textAlign: "center" }} onSubmit={this.testLogoutListener}>
                    <button>Logout</button>
                </form>
            </div>
        );
    }
    
}

export default Login;