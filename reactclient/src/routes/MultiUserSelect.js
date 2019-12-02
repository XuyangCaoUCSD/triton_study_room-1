// front-end underlying technology: React
import React, {Component} from 'react';
// we use axios for data communication between front-end and back-end
import { Button, Modal, Form, Image, Grid, List, Input } from 'semantic-ui-react'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

import API from '../utilities/API';

import UserSearch from './UserSearch';

import UserDropdown from './UserDropdown';

//this component will consist of a dropdown menu and a search bar
//to specify the scope of users you will be select from you can pass the namespace to one of its props called namespace
export default class MultiUserSelect extends Component {
    constructor(props) {
        super(props);

        this.localizer = momentLocalizer(moment);
        this.state = {
            selectedUsers: [],
            usersDisplay: [],
            startTime: "",
            endTime: "",
            eventTitle: "",
            location: "",
            desc: "",
            matchingSchedule: [],
            calendarEvents: []
        };

        this.pushUser = this.pushUser.bind(this);
        this._removeUser = this._removeUser.bind(this);
        this._multiUserSubmit = this._multiUserSubmit.bind(this);
        this.scheduleMatchAPI = this.scheduleMatchAPI.bind(this);
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
            if(this.props.creationType === "createStudySession") {
                //Here we call the schedule matching API
                this.scheduleMatchAPI(tempSelectedUsers);
            }
        }


        //console.log("array is "+JSON.stringify(this.state));
    }

    _removeUser(event) {
        //console.log(event.currentTarget.name);
        for(var i = 0; i < this.state.selectedUsers.length; i++) {
            if(this.state.selectedUsers[i].email === event.currentTarget.name) {
                const tempSelectedUsers = this.state.selectedUsers;
                tempSelectedUsers.splice(i, 1);
                this.setState({selectedUsers: tempSelectedUsers});
                if(this.props.creationType === "createStudySession") {
                    //Here we call the schedule matching API
                    this.scheduleMatchAPI(tempSelectedUsers);
                }
            }
        }

        for(var j = 0; j < this.state.usersDisplay.length; j++) {
            if(this.state.usersDisplay[j].key === event.currentTarget.name) {
                const tempUsersDisplay = this.state.usersDisplay;
                tempUsersDisplay.splice(j, 1);
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

    handleEventClick = (e) => {
        let startTime = moment(e.start);
        let endTime = moment(e.end);
        alert(`${startTime.format('L')} ${startTime.format('LT')} to ${endTime.format('L')} ${endTime.format('LT')}`)
    }
    scheduleMatchAPI(hotData) {
        
        console.log("we have selected users: "+JSON.stringify(hotData));
        API({
            method: 'post',
            url: "/api/calendar/shedule-matching",
            data: {
                users: hotData
            },
            withCredentials: true,
        }).then((res) => {
            // check what our back-end Express will respond (Does it receive our data?)
            // console.log(response.data);
            let data = res.data;
            if (!data || !data.success) {
                console.log("Failed API call for schedule matching");
                return
            }

            let availableTimes = data.availableTimes;

            if (availableTimes) {
                let availableTimesToDisplay;
                let calendarEvents = [];
                // String is for special cases (All free or all busy etc.)
                if (typeof availableTimes === 'string' || availableTimes instanceof String) {
                    availableTimesToDisplay = [availableTimes];
                } else {
                    availableTimesToDisplay = availableTimes.map((interval) => {
                        return `${moment(interval[0]).format('L')} ${moment(interval[0]).format('LT')} to ${moment(interval[1]).format('L')} ${moment(interval[1]).format('LT')}`;
                    });

                    calendarEvents = availableTimes.map((interval) => {
                        return {
                            start: new Date(interval[0]),
                            end: new Date(interval[1]),
                        }
                    }) 
                }

                if(this._isMounted) {
                    this.setState({
                        matchingSchedule: availableTimesToDisplay,
                        calendarEvents: calendarEvents
                    });
                }
            }
            
        }).catch((error) => {
            // if we cannot send the data to Express
            console.log("error when shedule matching: "+error);
            alert("failed to update schedule matching fields!");
        });
        
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
                if (this.props.closeModal) {
                    this.props.closeModal();
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

            let startDate = new Date(this.state.startTime);
            let endDate = new Date(this.state.endTime);

            //check if current time < picked start time < picked end time
            if(!(this.currentTime < startDate)) {
                alert("Your picked start time is before the current time! Please reselect.");
                return;
            }

            if(!(startDate < endDate)) {
                alert("Your picked end time is not after your picked start time! Please reselect.");
                return;
            }

            //now assemble the body data and send

            const bodyData = {
                selectedUsers: this.state.selectedUsers,
                sessionName: "ece35 midterm review",
                startTime: startDate,
                endTime: endDate,
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
                if (this.props.closeModal) {
                    this.props.closeModal();
                }
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
        if(this.props.creationType === "createStudySession") {
            //Here we call the schedule matching API
            this.scheduleMatchAPI([]);
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    ifGenerateTimePick() {
        if(this.props.creationType === "createStudySession") {
            return (
                <div>
                    <Form.Field required>
                        <label>Pick a start time</label>
                        <input type="datetime-local" id="start-point"
                        name="start-point" style={{maxWidth:300}}
                        onChange={e => this.setState({startTime: e.target.value})}></input>
                    </Form.Field>
                    <Form.Field required>
                    <label>Pick an end time</label>
                    <input type="datetime-local" id="end-point"
                    name="end-point" style={{maxWidth:300}}
                    onChange={e => this.setState({endTime: e.target.value})}></input>
                    </Form.Field>
                    

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


                    <Form.Field onChange={e => this.setState({location: e.target.value})} control={Input} label="Study session location">

                    </Form.Field>

                    <Form.Field onChange={e => this.setState({desc: e.target.value})} control={Input} label="Study session description">

                    </Form.Field>

                </div>
                
            );
        }
        else {
            return (null);
        }
    }

    displayListOfSchedule() {
        const ListOfSchedules = [];
        for(var i = 0; i < this.state.matchingSchedule.length; i++) {
            ListOfSchedules.push(
                <List.Item key={i} >
                    {this.state.matchingSchedule[i]}
                </List.Item>     
            )
        }

        return ListOfSchedules;
    }


    openCalendar = (e) => {
        this.setState({
            calendarOpen: true
        });
    }

    closeCalendar = (e) => {
        this.setState({
            calendarOpen: false
        });
    }

    ifGenerateMatchSchedule() {
        if(this.props.creationType === "createStudySession") {
            let calendarModal =
            <Modal
                open={this.state.calendarOpen}
                closeIcon
                onClose={this.closeCalendar}
                size='large' 
                trigger={<Button onClick={this.openCalendar}>See free time in calendar format</Button>}
            >
                <Modal.Header>Free time</Modal.Header>
                <Modal.Content >
                    <BigCalendar
                        culture='en-US'
                        events={this.state.calendarEvents}
                        step={10}
                        timeslots={6}
                        // popup
                        // selectable
                        onSelectEvent={this.handleEventClick}
                        // onSelectSlot={this.handleSelectSlot}
                        views={['month', 'week', 'day']}
                        defaultView='week'
                        localizer={this.localizer}
                        startAccessor="start"
                        endAccessor="end"
                        style={{height: "55vh", width: "100wh"}}
                    />
                </Modal.Content>
            </Modal>;
            return (
                <Grid.Column width={5}>
                    <h3>Common available times in the following two weeks</h3>
                    <List>
                        {this.displayListOfSchedule()} 
                    </List>
                    {calendarModal}                    
                    
                      
                </Grid.Column>

            );
        } else {
            return (null);
        }
    }

    render() {
       
        return (
            <Grid>
                <Grid.Column width={6}>
                    <Form>
                    <Form.Field required control={Input} onChange={e => this.setState({eventTitle: e.target.value})} label={this.props.creationType === "createNamespace" ? "Study group name" : "Study session title"}>
                    </Form.Field>
                    {this.ifGenerateLocation()}
                    <br />
                    <Form.Field>
                        <label>Invite some people</label>
                        <UserSearch endpoint={this.props.endpoint} goal="multi_select" uponselection={this.pushUser} />
                    </Form.Field>

                    <UserDropdown endpoint={this.props.endpoint} uponselection={this.pushUser} />
                    <br /><br />
                    {this.ifGenerateTimePick()}
                    <br /><br />
                    <Button color='green' onClick={this._multiUserSubmit}>{this.props.creationType === "createNamespace" ? "Create a study group" : "Create this study session"}</Button>
                    </Form>
                </Grid.Column>
                <Grid.Column width={1}></Grid.Column>
                <Grid.Column width={4}>
                    <h3>Selected Users</h3>
                    <List>
                        {this.state.usersDisplay}
                    </List>
                </Grid.Column>
                {this.ifGenerateMatchSchedule()}
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