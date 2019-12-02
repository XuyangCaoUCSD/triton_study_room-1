import React, {Component } from 'react';
import auth from "../auth/auth";
import { Button, Form } from 'semantic-ui-react';

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
                <Form style={{ textAlign: "center" }} onSubmit={this.testLogoutListener}>
                    <Button primary >
                        Logout
                    </Button>
                </Form>
            </div>
        );
    }
    
}

export default Logout;