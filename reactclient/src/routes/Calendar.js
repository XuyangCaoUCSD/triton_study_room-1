import React, {Component} from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment'
import { Button, Form, Input, Select, TextArea } from 'semantic-ui-react';
import API from '../utilities/API';
import Modal from 'react-awesome-modal';

class Calendar extends Component {
    constructor(props, context) {
        super(props, context);

        this.localizer = momentLocalizer(moment);
        this.state = {
            events:  [
                // {
                //     'title': 'All Day Event very long title',
                //     'allDay': true,
                //     'start': new Date('November 26, 2019 11:13:00'),
                //     'end': new Date('November 26, 2019 12:13:00'),
                // },
                // {
                //     'title': 'OLD EVENT',
                //     'allDay': true,
                //     'start': new Date('November 26, 2018 11:13:00'),
                //     'end': new Date('November 26, 2018 23:13:00'),
                // },
                // {
                //     'title': 'Long Event',
                //     'start': new Date('November 26, 2019 11:13:00'),
                //     'end': new Date('November 27, 2019 11:13:00')
                // },
                // {
                //     'title': 'SOMETHING STARTS',
                //     'start': new Date('November 24, 2019 11:13:00'),
                //     'end': new Date('November 24, 2019 12:15:00'),
                //     desc: 'BLAH'
                // },
            ],

            clickedEvent: null,
            modifyModalOpen: false
        }

        this.addEventAPI = this.addEventAPI.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;

        // Get user's current events
        API({
            method: 'get',
            url: `/api/calendar`,
            withCredentials: true
        }).then((res) => {
            console.log('Get on calendar route, Server responded with:');
            console.log(res);

            let data = res.data;
            console.log(data);

            if (!data.success) {
                console.log('Unsuccessful getting calendar info');
                return;
            }

            let userEvents = data.events.map((eventInfo) => {
                return {
                    _id: eventInfo._id,
                    start: new Date(eventInfo.start),
                    end: new Date(eventInfo.end),
                    allDay: eventInfo.allDay,
                    title: eventInfo.title,
                    desc: eventInfo.description
                }
            });

            console.log('events are ');
            console.log(userEvents);

            if (this._isMounted) {
                console.log('Setting initial events');

                this.setState({
                    events: userEvents
                });
            }    
            
        }).catch((err) => {
            console.log("Error while getting calendar route, logging error: \n" + err);
            // Either use toString or ==
            if (err.response && err.response.status) {
                console.log('err.response is: \n');
                console.log(err.response);

                let statusCode = err.response.status.toString();
                if (statusCode === "401") {
                    console.log("ERROR code 401 received - UNAUTHENTICATED");
                    this.props.history.push("/login/error");
                } else if (statusCode === "403") { 
                    console.log("ERROR code 403 received - UNAUTHORISED CREDENTIALS");
                    this.setState({
                        unauthorised: true
                    });
                }
                
            }

        });
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    handleSelectSlot = ({ start, end }) => {
        const title = window.prompt('New Event name')
        if (title) {
            let newEvent = {
                start,
                end,
                title
            }
            
            this.addEventAPI(newEvent);
        }
          
    }

    handleEventClick = (e) => {
        console.log(e);

        this.setState({
            clickedEvent: e,
            modifyModalOpen: true
        });
    }

    closeModifyModal = () => {
        this.setState({
            modifyModalOpen: false
        });
    }

    handleModifyEventSubmit = (e) => {
        e.preventDefault();

        // TOOD DELETE CASE

        console.log('submitted event is');
        console.log(e);

        console.log('e.target is');
        console.log(e.target);

        let eventId = this.state.clickedEvent._id;

        let modifiedEvent = {
            _id: eventId,
            start: e.target.elements.start.value,
            end: e.target.elements.end.value,
            description: e.target.elements.description.value
        }

        console.log('modified event is');
        console.log(modifiedEvent);

        // let startDate = new Date(modifiedEvent.start);
        // let endDate = new Date(modifiedEvent.end);
        // console.log('start and end dates are');
        // console.log(startDate);
        // console.log(endDate);
        
        let data = {
            patchType: 'modify',
            calendarEvent: modifiedEvent
        }

        API({
            method: 'patch',
            url: `/api/calendar`,
            withCredentials: true,
            data
        }).then((res) => {

            console.log('Patch on calendar route, Server responded with:');
            console.log(res);

            let data = res.data;
            console.log(data);

            if (!data.success) {
                console.log('Unsuccessful updating calendar info');
                return;
            }

            if (this._isMounted) {
                console.log('Adding new event to events array');
                
                let responseEvent = data.modifiedEvent;

                let modifiedEvent = {
                    _id: responseEvent._id,
                    title: responseEvent.title,
                    allDay: responseEvent.allDay,
                    start: new Date(responseEvent.start),
                    end: new Date(responseEvent.end),
                    desc: responseEvent.description
                }

                console.log('modified event received as response is');
                console.log(modifiedEvent);

                let updatedEventsArr = [...this.state.events];

                let foundIndex = -1;
                // Find event to update on front end
                for (var i = 0; i < updatedEventsArr.length; ++i) {
                    if (updatedEventsArr[i]._id == updatedEventsArr._id) {
                        foundIndex = i;
                        break;
                    } 
                }

                if (foundIndex === -1) {
                    console.log('Could not find event to update on front end');
                    return;
                }

                updatedEventsArr[foundIndex] = modifiedEvent;
                
                if (this._isMounted) {
                    console.log("updating events array");
                    this.setState({
                        events: updatedEventsArr,
                    });
                }
                
            }    
            
        }).catch((err) => {
            console.log("Error while making patch request to calendar route, logging error: \n" + err);
            // Either use toString or ==
            if (!err) {
                console.log('Could not confirm error type from server');
                return;
            }

            if (err.response && err.response.status) {
                console.log('err.response is: \n');
                console.log(err.response);

                let statusCode = err.response.status.toString();
                if (statusCode === "401") {
                    console.log("ERROR code 401 received - UNAUTHENTICATED");
                    this.props.history.push("/login/error");
                } else if (statusCode === "403") { 
                    console.log("ERROR code 403 received - UNAUTHORISED CREDENTIALS");
                    if (this._isMounted) {
                        this.setState({
                            unauthorised: true
                        });
                    }
                }
                
            }

        });
    }
    
    addEventAPI(newEvent) {
        console.log('Calling API to add event');
        let data = {
            patchType: 'add',
            calendarEvent: newEvent
        }

        console.log('data to send in API is');
        console.log(data);

        API({
            method: 'patch',
            url: `/api/calendar`,
            withCredentials: true,
            data
        }).then((res) => {

            console.log('Patch on calendar route, Server responded with:');
            console.log(res);

            let data = res.data;
            console.log(data);

            if (!data.success) {
                console.log('Unsuccessful updating calendar info');
                return;
            }

            if (this._isMounted) {
                console.log('Adding new event to events array');
                
                let responseEvent = data.newEvent;

                let newEvent = {
                    _id: responseEvent._id,
                    title: responseEvent.title,
                    allDay: responseEvent.allDay,
                    start: new Date(responseEvent.start),
                    end: new Date(responseEvent.end),
                    desc: responseEvent.description
                }

                console.log('new event received as response is');
                console.log(newEvent);

                let newEventsArr = [...this.state.events, newEvent];
                if (this._isMounted) {
                    console.log('Updating new events array')
                    this.setState({
                        events: newEventsArr,
                    });
                }
                
            }    
            
        }).catch((err) => {
            console.log("Error while making patch request to calendar route, logging error: \n" + err);
            if (!err) {
                console.log('Could not confirm error type from server');
                return;
            }
            // Either use toString or ==
            if (err.response && err.response.status) {
                console.log('err.response is: \n');
                console.log(err.response);

                let statusCode = err.response.status.toString();
                if (statusCode === "401") {
                    console.log("ERROR code 401 received - UNAUTHENTICATED");
                    this.props.history.push("/login/error");
                } else if (statusCode === "403") { 
                    console.log("ERROR code 403 received - UNAUTHORISED CREDENTIALS");
                    this.setState({
                        unauthorised: true
                    });
                }
                
            }

        });
    }

    render() {
        let modifyModalContent = null;
        if (this.state.clickedEvent) {
            let startTime = this.state.clickedEvent.start.toLocaleTimeString([], {year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'});
            let endTime = this.state.clickedEvent.end.toLocaleTimeString([], {year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'});
            let description = this.state.clickedEvent.desc ? this.state.clickedEvent.desc : "";
            modifyModalContent = 
                <div style={{padding: '1em'}}>
                    <h1>{this.state.clickedEvent.title}</h1>
                     <Form onSubmit={this.handleModifyEventSubmit}>
                        <Form.Group widths='equal'>
                            <Form.Field
                                name='start'
                                control={Input}
                                label='Start Time'
                                placeholder='Start time'
                                value={startTime}
                            />
                            <Form.Field
                                name='end'
                                control={Input}
                                label='End Time'
                                placeholder='End time'
                                value={endTime}
                            />
                        </Form.Group>

                        <Form.Field
                            name='description'
                            control={TextArea}
                            label='Description'
                            placeholder='Description'
                            value={description}
                        />
                        <Form.Field
                            control={Button}
                            content='Update'
                            label='Label'
                        />
                    </Form>
                    
                    
                    <Button style={{position: 'absolute', right: '5%'}}onClick={() => this.closeModifyModal()}>Close</Button>               
                </div>
        }
        
        return (
            <div>
                <Modal visible={this.state.modifyModalOpen} width="40%" height="50%" effect="fadeInUp" onClickAway={() => this.closeModifyModal}>
                    {modifyModalContent}
                </Modal>
                <BigCalendar
                    culture='en-US'
                    events={this.state.events}
                    step={5}
                    timeslots={12}
                    popup
                    selectable
                    onSelectEvent={this.handleEventClick}
                    onSelectSlot={this.handleSelectSlot}
                    views={['month', 'week', 'day', 'agenda']}
                    localizer={this.localizer}
                    startAccessor="start"
                    endAccessor="end"
                    style={{height: 800}}
                />
            </div>
        );
    }
}

export default Calendar;