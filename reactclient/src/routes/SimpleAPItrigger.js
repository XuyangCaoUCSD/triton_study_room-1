// front-end underlying technology: React
import React, {Component} from 'react';
// we use axios for data communication between front-end and back-end
import { Button, Checkbox, Form, Image, Grid, List, Label } from 'semantic-ui-react'

import API from '../utilities/API';

class SimpleAPItrigger extends Component {
    constructor(props) {
        super(props);

        this._onChange = this._onChange.bind(this);
    }


    // this function will be triggered when the "update" button is clicked
    // this function will send the updated value to the back-end Express (which will then store the data to MongoDB)
    _onChange(event) {
        event.preventDefault();
        // assemble HTTP post request
        // put the updated value (with user id) into the request body in the form of json
        API({
            method: 'get',
            url: "/api/namespace/cse100/get-potential-list",
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


    componentDidMount() {
    }

    componentDidUpdate() {
    }

    componentWillUnmount() {
    }

    // render the component
    render() {
        return(
            <Button onClick={this._onChange}>Retrieve public namespace data</Button>
        );
    }
}

export default SimpleAPItrigger;