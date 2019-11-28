// front-end underlying technology: React
import React, {Component} from 'react';
// we use axios for data communication between front-end and back-end
import { Button, Checkbox, Form, Image, Grid, List, Label } from 'semantic-ui-react'

import API from '../utilities/API';

import UserSearch from './UserSearch';

import UserDropdown from './UserDropdown';

//this component will consist of a dropdown menu and a search bar
//to specify the scope of users you will be select from you can pass the namespace to one of its props called namespace
export default class MultiUserSelect extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedUsers: [],
            usersDisplay: []
        };

        this.pushUser = this.pushUser.bind(this);
        this._removeUser = this._removeUser.bind(this);
        this._multiUserSubmit = this._multiUserSubmit.bind(this);
    }

    //push an user into selectedUsers
    pushUser(user) {
        //linear search to check if the user is in the selectedUsers already (by email matching)??
        for(var i = 0; i < this.state.selectedUsers.length; i++) {
            if(user.email === this.state.selectedUsers[i].email) {
                console.log("user already pushed!");
                return;
            }
        }
        //user doesn't exist before
        if(this._isMounted) {
            const tempSelectedUsers = this.state.selectedUsers.concat(user);;
            this.setState({selectedUsers: tempSelectedUsers});


            const tempUsersDisplay = this.state.usersDisplay.concat(
                <List.Item key={user.email} name={user.email}>
                <span>
                <Image avatar src={user.avatar} />
                <List.Content>
                  <List.Header as='a'>{user.title}</List.Header>
                  <List.Description>
                    {user.email}
                  </List.Description>
                </List.Content>
                <Button name={user.email} onClick={this._removeUser}>Remove</Button>
                </span>
              </List.Item>
            );
            this.setState({usersDisplay: tempUsersDisplay});
        }
        console.log("array is "+JSON.stringify(this.state));
    }

    _removeUser(event) {
        //console.log(event.currentTarget.name);
        for(var i = 0; i < this.state.selectedUsers.length; i++) {
            if(this.state.selectedUsers[i].email === event.currentTarget.name) {
                const tempSelectedUsers = this.state.selectedUsers;
                tempSelectedUsers.splice(i, 1);
                this.setState({selectedUsers: tempSelectedUsers});
            }
        }

        for(var i = 0; i < this.state.usersDisplay.length; i++) {
            if(this.state.usersDisplay[i].key === event.currentTarget.name) {
                const tempUsersDisplay = this.state.usersDisplay;
                tempUsersDisplay.splice(i, 1);
                this.setState({usersDisplay: tempUsersDisplay});
            }
        }

    }

    _multiUserSubmit(event) {
        event.preventDefault();
        // assemble HTTP post request
        // put the updated value (with user id) into the request body in the form of json
        API({
            method: 'post',
            url: "/api/multiUserSubmit",
            data: {
            selectedUser: this.state.selectedUsers
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



    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    render() {
        return (
            <Grid>
                <Grid.Column width={4}>
                    <UserSearch endpoint={this.props.endpoint} goal="multi_select" action={this.pushUser} />
                    <br /><br />
                    <UserDropdown endpoint={this.props.endpoint} action={this.pushUser} />
                    <br /><br />
                    <Button onClick={this._multiUserSubmit}>Create a study group</Button>
                </Grid.Column>
                <Grid.Column width={4}>
                    <h3>Selected User</h3>
                    <List>
                        {this.state.usersDisplay}
                    </List>
                </Grid.Column>
            </Grid>
        );
    };
}

//by default if no namespace is given the scope is global
MultiUserSelect.defaultProps = {
    endpoint: "/global"
};