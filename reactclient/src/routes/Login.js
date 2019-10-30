import React, {Component } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";
import UserForm from '../UserForm';
import auth from "../auth/auth";

class Login extends Component {
    constructor() {
        super();
        this.state = {}
        this.getUser = this.getUser.bind(this);
        this.testLogoutListener = this.testLogoutListener.bind(this);
        this.googleLogInHandler = this.googleLogInHandler.bind(this);
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
        // API({
        //     method: 'post',
        //     url: `/login`,
        //     data,
        //     withCredentials: true
        // })
        // .then((res) => {
        //     console.log(res);
        //     // const data = res.data;
        //     // this.setState({});
        // })
        // .catch((err) => {
        //     console.log("Error logging in");
        //     console.log(err);
        // });
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
        // API({
        //     method: 'get',
        //     url: `/logout`,
        //     withCredentials: true
        // })
        // .then((res) => {
        //     console.log("Check response is");
        //     console.log(res);
        //     // const data = res.data;
        //     // this.setState({});
        // })
        // .catch((err) => {
        //     console.log("Failed check");
        //     console.log(err);
        // });

      
    }

    // googleLogInHandler(e) {
    //     e.preventDefault();
    //     API({
    //         method: 'get',
    //         url: `/auth/google`,
    //         withCredentials: true,

    //         // headers: {
    //         //     'Access-Control-Allow-Origin': '*',
    //         // }
            
    //     })
    //     .then((res) => {
    //         console.log("Google auth response is");
    //         console.log(res);
    //         // const data = res.data;
    //         // this.setState({});
    //     })
    //     .catch((err) => {
    //         console.log("Failed google auth");
    //         console.log(err);
    //     });
    // }

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
        return (
            <div>
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