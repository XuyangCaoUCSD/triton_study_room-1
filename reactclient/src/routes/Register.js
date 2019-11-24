import React, {Component } from 'react';
import UserForm from '../UserForm';
import API from '../utilities/API';

class Register extends Component {
    constructor() {
        super();
        this.state = {}
        this.getUser = this.getUser.bind(this);
        this.testListener = this.testListener.bind(this);
    }
    
    getUser = (e) => {
        e.preventDefault();
        const username = e.target.elements.username.value; // Extract submitted text in input in UserForm
        const password = e.target.elements.password.value;

        const data = {
            username,
            password
        }

        API({
            method: 'post',
            url: `/register`,
            data,
            withCredentials: true

        }).then((res) => {
            console.log(res);
            // const data = res.data;
            // this.setState({});

        }).catch((err) => {
            console.log("Error in registration");
            console.log(err);
        });
      
    }

    // Temporary testing logged in authorisation
    testListener(e) {
        e.preventDefault();

        API({
            method: 'get',
            url: `/check`,
            withCredentials: true

        }).then((res) => {
            console.log("Check response is");
            console.log(res);
            // const data = res.data;
            // this.setState({});

        }).catch((err) => {
            console.log("Failed logged in check");
            console.log(err);
        });
      
    }

    render () {
        return (
            <div>
                <h2>Register</h2>
                <UserForm getUser={this.getUser} />

                <p></p>
                <form style={{ textAlign: "center" }} onSubmit={this.testListener}>
                    <button>Test if logged in</button>
                </form>
            </div>
        );
    }
    
}

export default Register;