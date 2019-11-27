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
import {Grid, Header, Label, Message, Divider, Image} from 'semantic-ui-react';

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
        
        let paramError = this.props.match.params ? this.props.match.params.error : null;

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
            null;

        
        return (
            <div>
                <div className="ui center aligned middle aligned container" >
                    {errorDisplay}
                    <Image size="medium" centered={true} src="../geisel.svg"/>
                    <Header style={{"font-size": "50px"}}>Triton Study Room</Header>
                    <Divider/>
                    <Grid columns={3}>
                        <Grid.Column>
                            <Header className="center aligned icon">
                                <i className="user blue icon"/>
                                Find Friends
                            </Header>
                        </Grid.Column>
                        <Grid.Column>
                            <Header className="center aligned icon">
                                <i className="calendar outline blue icon"/>
                                Match Study Times
                            </Header>
                        </Grid.Column>
                        <Grid.Column>
                            <Header className="center aligned icon">
                                <i className="book blue icon"/>
                                Reserve Study Spaces
                            </Header>
                        </Grid.Column>
                    </Grid>
                    <Divider/>
                    <div className="ui google blue button center" onClick={this.googleLogInHandler}>
                        <i aria-hidden="true" className="google icon"/> UCSD Student Login
                    </div>
                    <p></p>
                    <div className="ui labeled button" tabIndex="0">
                        <div className="ui gold button center" onClick={this.googleLogInHandler}>
                            <i aria-hidden="true"/> Register Now
                        </div>
                        <Label className="ui basic gold left">
                            Requires UCSD Student Account
                        </Label>
                    </div>
                </div>
            </div>
        );
    }
    
}

export default Login;