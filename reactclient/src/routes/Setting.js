//jshint esversion:6

// front-end underlying technology: React
import React, {Component} from 'react';
// we use axios for data communication between front-end and back-end
import { Button, Checkbox, Form, Image } from 'semantic-ui-react'

import API from '../utilities/API';

// our setting page DOM
class Setting extends Component {
    constructor(props) {
        super(props);

        // in the setting page, we let user update two fields: "about me" and the phone number
        // thus we create two variables to keep track of any changes (plus a variable storing current user's database id)
        this.state = {
            aboutMe: "",
            phone: "",
            firstName: "",
            lastName: "",
            isChecked: true
        }

        this._onChange = this._onChange.bind(this);
        this.fetch_data = this.fetch_data.bind(this);
    }


    // this function will be triggered when the "update" button is clicked
    // this function will send the updated value to the back-end Express (which will then store the data to MongoDB)
    _onChange(event) {
        event.preventDefault();
        // assemble HTTP post request
        // put the updated value (with user id) into the request body in the form of json
        API({
            method: 'post',
            url: "/api/setting",
            data: {
            aboutMe: this.state.aboutMe,
            phone: this.state.phone
            },
            withCredentials: true,
        }).then((response) => {
            // check what our back-end Express will respond (Does it receive our data?)
            console.log(response.data);
            alert("data updated successfully!");
        }).catch((error) => {
            // if we cannot send the data to Express
            console.log("error when submitting: "+error);
            alert("failed to update these fields!");
        });
    }


    // when we load the "setting page" component, retrieve the data from our database
    componentDidMount() {
        this._isMounted = true;
        this.fetch_data();
    }

    componentDidUpdate() {
        //console.log(this.state.isChecked);
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    // anytime when the component is loaded (refreshed using "F5"), the most updated value should be retrieved
    fetch_data() {
        API({
            // assemble HTTP get request
            // again include the user id so our backend will know who you are
            method: 'get',
            url: "/api/setting/dataRetrieve",
            withCredentials: true,
        }).then((response) => {
            // extract the data from the body of response
            console.log("data successfully retrieved from backend!");
            console.log(response.data);
            if (this._isMounted) {
                // assign what we received to the state variables which will be rendered
                this.setState({aboutMe: response.data.aboutMe});
                this.setState({phone: response.data.phone});
                this.setState({firstName: response.data.firstName});
                this.setState({lastName: response.data.lastName});
            }
            
        }).catch((error) => {
            // otherwise some error occurs
            console.log("error when submitting: "+error);
        });
    }

    toggleChange = () => {
        this.setState({
            isChecked: !this.state.isChecked,
        });
    }

    // render the component
    render() {
        return(
            <div className="setting-form">
                <Form.Field>
                <br />
                <h2 id="setting-title">Profile Settings Page <img id="gear" src="https://img.icons8.com/wired/64/000000/gear.png" /></h2>
                <br />
                </Form.Field>
                <Form method="post">
                    <Form.Field>
                    <label>First Name: {this.state.firstName} </label>
                    <label>Last Name: {this.state.lastName}</label>
                    </Form.Field>
                    <Form.Field>
                    <label>About Me</label>
                    <textarea style={{maxWidth:500}} className="box"  onChange={e => this.setState({aboutMe: e.target.value})} defaultValue={this.state.aboutMe}></textarea>
                    </Form.Field>
                    <Form.Field>
                    <label>Phone Number</label>
                    <input id="phone" style={{maxWidth:200}} type="text" onChange={e => this.setState({phone: e.target.value})} defaultValue={this.state.phone}></input>
                    </Form.Field>
                    <Form.Field>
                    <Checkbox checked={this.state.isChecked} onChange={this.toggleChange} label='display my phone number to others' />
                    </Form.Field>
                    <Button onClick={this._onChange}>Update</Button>
                </Form>
            </div>
        );
    }
}

export default Setting;
