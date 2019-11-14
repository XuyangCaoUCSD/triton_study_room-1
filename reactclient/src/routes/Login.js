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

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {}
        this.testLogoutListener = this.testLogoutListener.bind(this);
        this.googleLogInHandler = this.googleLogInHandler.bind(this);
        
    }

    componentDidMount() {
        console.log('Login props are');
        console.log(this.props);
        console.log('done');

        // If already logged in redirect to dashboard
        if (this.props.isLoggedIn) {
            console.log('Already logged in, redirecting to dashboard')
            this.props.history.push('/dashboard');
        }
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

    googleLogInHandler (e) {
        e.preventDefault(); // needed to prevent form from refreshing page
        
        auth.googleLogin(
            (res) => {
                // this.props.authMemoHandler();
                // this.props.history.push("/dashboard");
                
            }, (err) => {
                console.log(err);
            }
        );
    }

    render() {
        let history = this.props.history;
        let location = this.props.location;
        
        let paramError = this.props.params ? this.props.params.error : null;

        // where to redirect after login (TODO sendover to server so server can change successRedirect route)
        let { from } = location.state || { from: { pathname: "/" } }; 

        // Display not logged in error if redirected from dashboard, or
        // redirected from google auth route (maybe as not using valid ucsd email)
        let redirectedFromGoogle = false;
        if (window.location.toString().indexOf('#') !== -1) {  // If hash in link, redirected from google
            redirectedFromGoogle = true;
        }
        let errorDisplay = 
            (redirectedFromGoogle || paramError || (location.state && location.state.loginError)) ? 
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
                    <button className="ui google plus button">
                        <i aria-hidden="true" className="google plus icon"></i>
                        Google Login
                    </button>
                </form>
                <p></p>
                <form style={{ textAlign: "center" }} onSubmit={this.testLogoutListener}>
                    <button>Logout</button>
                </form>
            </div>
        );
    }
    
}

export default Login;