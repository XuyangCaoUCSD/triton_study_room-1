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
            usersDisplay: [],
            startTime: "",
            endTime: "",
            eventTitle: "",
            location: "",
            desc: ""
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

    generateDateObject(timeString) {
        const year = Number(timeString.substring(0, 4));
        // Date's month ranges from 0 (Jan) to 11 (Dec)
        const month = Number(timeString.substring(5, 7)) - 1;
        const day = Number(timeString.substring(8, 10));
        const hours = Number(timeString.substring(11, 13));
        const minutes = Number(timeString.substring(14, 16));
        return new Date(year, month, day, hours, minutes);
    }

    _multiUserSubmit(event) {
        event.preventDefault();
        // assemble HTTP post request
        // put the updated value (with user id) into the request body in the form of json
        console.log('selectedUsers are');
        console.log(this.state.selectedUsers);
        if(this.props.creationType === "createNamespace") {
            if(this.state.eventTitle === "") {
                alert("Please enter a name for this study group!");
                return;
            }
            API({
                method: 'post',
                url: "/api/namespace",
                data: {
                    peopleDetailsList: this.state.selectedUsers,
                    groupName: this.state.eventTitle
                },
                withCredentials: true,
            }).then((response) => {
                // check what our back-end Express will respond (Does it receive our data?)
                console.log(response.data);
                alert("data updated successfully!");
                if (this.props.closeGroupModal) {
                    this.props.closeGroupModal();
                }
                if (this.props.getGroupsAPICall) {
                    this.props.getGroupsAPICall();
                }
                
            }).catch((error) => {
                // if we cannot send the data to Express
                console.log("error when submitting: "+error);
                alert("failed to update these fields!");
            });
        } 
        else if(this.props.creationType === "createStudySession") {
            //check if the user has entered an event title
            if(this.state.eventTitle === "") {
                alert("Please enter a title for this study session!");
                return;
            }

            //check if the user has not pick time yet
            if(this.state.startTime === "" || this.state.endTime === "") {
                alert("Please pick both the start time and end time!");
                return;
            }

            //check if current time < picked start time < picked end time
            if(!(this.currentTime < this.generateDateObject(this.state.startTime))) {
                alert("Your picked start time is before the current time! Please reselect.");
                return;
            }

            if(!(this.generateDateObject(this.state.startTime) < this.generateDateObject(this.state.endTime))) {
                alert("Your picked end time is not after your picked start time! Please reselect.");
                return;
            }

            //now assemble the body data and send

            const bodyData = {
                selectedUsers: this.state.selectedUsers,
                sessionName: "ece35 midterm review",
                startTime: this.state.startTime,
                endTime: this.state.endTime,
                title: this.state.eventTitle,
                location: this.state.location,
                desc: this.state.desc
            };

            API({
                method: 'post',
                url: "/api/createStudySession",
                data: bodyData,
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
    }

    componentDidMount() {
        this._isMounted = true;
        this.currentTime = new Date();
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    ifGenerateTimePick() {
        if(this.props.creationType === "createStudySession") {
            return (
                <div>
                    <Label>Pick a start time</Label>
                    <input type="datetime-local" id="start-point"
                    name="start-point" style={{maxWidth:300}}
                    onChange={e => this.setState({startTime: e.target.value})}></input>
                    <br />
                    <Label>Pick an end time</Label>
                    <input type="datetime-local" id="end-point"
                    name="end-point" style={{maxWidth:300}}
                    onChange={e => this.setState({endTime: e.target.value})}></input>
                </div>
            );
        }
        else {
            return (null);
        }
    }

    ifGenerateLocation() {
        if(this.props.creationType === "createStudySession") {
            return (
                <div>
                    <Label>Study session location</Label>
                    <input type="text" style={{maxWidth:300}}
                    onChange={e => this.setState({location: e.target.value})}
                    ></input>
                    <br /><br />
                    <Label>Study session description</Label>
                    <input type="text" style={{maxWidth:300}}
                    onChange={e => this.setState({desc: e.target.value})}
                    ></input>
                </div>
                
            );
        }
        else {
            return (null);
        }
    }

    render() {
        return (
            <Grid>
                <Grid.Column width={8}>
                    <Form>
                    <Form.Field>
                    <Label>{this.props.creationType === "createNamespace" ? "Study group name" : "Study session title"}</Label>
                    <br />
                    <input type="text" style={{maxWidth:300}}
                    onChange={e => this.setState({eventTitle: e.target.value})}></input>
                    <br /><br />
                    {this.ifGenerateLocation()}
                    </Form.Field>
                    <Label>Invite some people</Label>
                    <br />
                    <UserSearch endpoint={this.props.endpoint} goal="multi_select" uponSelection={this.pushUser} />
                    <br />
                    <UserDropdown endpoint={this.props.endpoint} uponSelection={this.pushUser} />
                    <br /><br />
                    {this.ifGenerateTimePick()}
                    <br /><br />
                    <Button onClick={this._multiUserSubmit}>{this.props.creationType === "createNamespace" ? "Create a study group" : "Create this study session"}</Button>
                    </Form>
                </Grid.Column>
                <Grid.Column width={4}>
                    <h3>Selected Users</h3>
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
    endpoint: "/global",
    // two types: createNamespace, createStudySession
    creationType: "createNamespace"
};