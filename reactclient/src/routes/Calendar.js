import React, {Component} from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import { Button, Form, Input, Select, Confirm, TextArea } from 'semantic-ui-react';
import API from '../utilities/API';
import Modal from 'react-awesome-modal';
import DateTimeRangeContainer from 'react-advanced-datetimerange-picker';
import {FormControl} from 'react-bootstrap';

class Calendar extends Component {
    constructor(props, context) {
        super(props, context);

        this.localizer = momentLocalizer(moment);

        // Give default start and ends
        let now = new Date();
        let currentEventStart = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0));
        let currentEventEnd = moment(currentEventStart).add(1, "days").subtract(1, "seconds");

        this.state = {
            currentEventStart,
            currentEventEnd,
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

            currentEvent: null,
            modifyModalOpen: false,
            removeConfirmOpen: false,
        }

        this.addEventAPI = this.addEventAPI.bind(this);
        this.applyEventDateChangeCallback = this.applyEventDateChangeCallback.bind(this);
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
                    desc: eventInfo.desc
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
            currentEvent: e,
            modifyModalOpen: true,
            currentEventStart: moment(e.start),
            currentEventEnd: moment(e.end)
        });
    }

    closeModifyModal = () => {
        this.setState({
            modifyModalOpen: false
        });
    }

    // Handles clicked event title change
    handleEventTitleChange = (e) => {
        let currentEvent = {...this.state.currentEvent};
        currentEvent.title = e.target.value;
        this.setState({
            currentEvent
        });
    }

    // Handles clicked event start change
    handleEventStartChange = (e) => {
        let currentEvent = {...this.state.currentEvent};
        currentEvent.start = e.target.value;
        this.setState({
            currentEvent
        });
    }

    // Handles clicked event end change
    handleEventEndChange = (e) => {
        let currentEvent = {...this.state.currentEvent};
        currentEvent.end = e.target.value;
        this.setState({
            currentEvent
        });
    }

    // Handles clicked event end change
    handleEventDescChange = (e) => {
        let currentEvent = {...this.state.currentEvent};
        currentEvent.desc = e.target.value;
        this.setState({
            currentEvent
        });
    }


    handleModifyEventSubmit = (e) => {
        e.preventDefault();

        console.log('submitted event is');
        console.log(e);

        console.log('e.target is');
        console.log(e.target);

        let eventId = this.state.currentEvent._id;

        let modifiedEvent = {
            _id: eventId,
            start: new Date(this.state.currentEventStart),
            end: new Date(this.state.currentEventEnd),
            title: e.target.elements.title.value,
            desc: e.target.elements.desc.value
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

        console.log('data to send is');

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
                    desc: responseEvent.desc
                }

                console.log('modified event received as response is');
                console.log(modifiedEvent);

                let updatedEventsArr = [...this.state.events];

                let foundIndex = -1;
                // Find event to update on front end
                for (var i = 0; i < updatedEventsArr.length; ++i) {
                    if (updatedEventsArr[i]._id === modifiedEvent._id) {
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
                        modifyModalOpen: false
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
    
    handleRemoveConfirmCancel = () => {
        this.setState({
            modifyModalOpen: true,
            removeConfirmOpen: false
        });
    }

    handleRemoveConfirmConfirmed = (e) => {
        e.preventDefault();

        let eventToDelete = {
            _id: this.state.currentEvent._id,
        }

        let data = {
            patchType: 'remove',
            calendarEvent: eventToDelete
        }

        // REMOVE EVENT API
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
                console.log('Removing event from array');
                let updatedEventsArr = [...this.state.events];

                let foundIndex = -1;
                // Find event to update on front end
                for (var i = 0; i < updatedEventsArr.length; ++i) {
                    if (updatedEventsArr[i]._id === eventToDelete._id) {
                        foundIndex = i;
                        break;
                    } 
                }

                if (foundIndex === -1) {
                    console.log('Could not find event to remove on front end');
                    return;
                }

                // Remove
                updatedEventsArr.splice(foundIndex, 1);
                
                if (this._isMounted) {
                    console.log("updating events array");
                    this.setState({
                        events: updatedEventsArr,
                        removeConfirmOpen: false,
                        modifyModalOpen: false
                    })
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

    // Just opens confirmation window, does not send a request to delete just yet
    handleDeleteEventClick = (e) => {
        e.preventDefault();

        this.setState({
            modifyModalOpen: false,
            removeConfirmOpen: true
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
                    desc: responseEvent.desc
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

    applyEventDateChangeCallback(startDate, endDate){
        this.setState({
            currentEventStart: startDate,
            currentEventEnd : endDate
        });
    }

    render() {
        let now = new Date();
        let currentTime = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0));
        // let end = moment(start).add(1, "days").subtract(1, "seconds");
        let ranges = {
            // "Today Only": [moment(start), moment(end)],
            // "Yesterday Only": [moment(start).subtract(1, "days"), moment(end).subtract(1, "days")],
            // "3 Days": [moment(start).subtract(3, "days"), moment(end)]
        }
        let local = {
            "format":"DD-MM-YYYY HH:mm",
            "sundayFirst" : true
        }
        let maxDate = moment(currentTime).add(2, "years"); // max is 2 years from now
        let eventRange = "";
        if (this.state.currentEventStart) {
            eventRange = moment(this.state.currentEventStart).format('LLLL') + " - " + moment(this.state.currentEventEnd).format('LLLL');
        }

        let SelectedEventDateTime = 
            <DateTimeRangeContainer 
                ranges={ranges}
                start={this.state.currentEventStart}
                end={this.state.currentEventEnd}
                local={local}
                maxDate={maxDate}
                autoApply
                applyCallback={this.applyEventDateChangeCallback}
            >    
                <Form.Field
                    control={Input}
                    label='Event Time'
                    required
                    readOnly
                    placeholder="Enter date and time range"
                    value={eventRange}
                /> 
            </DateTimeRangeContainer>;

        let modifyModalContent = null;
        if (this.state.currentEvent) {
            // let startTime = this.state.currentEvent.start.toLocaleTimeString([], {year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'});
            // let endTime = this.state.currentEvent.end.toLocaleTimeString([], {year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'});
            // let startTime = moment.parseZone(this.state.currentEvent.start) != "NaN" ? moment.parseZone(this.state.currentEvent.start) : this.state.currentEvent.start;
            // let endTime = moment.parseZone(this.state.currentEvent.end) != "NaN" ? moment.parseZone(this.state.currentEvent.end) : this.state.currentEvent.end;
            let description = this.state.currentEvent.desc ? this.state.currentEvent.desc : "";
            let eventName = this.state.currentEvent.title;
            modifyModalContent = 
                <div style={{padding: '1em'}}>
                    <h1>Modify event</h1>
                     <Form onSubmit={this.handleModifyEventSubmit}>
                        <Form.Field
                            required
                            name='title'
                            control={Input}
                            label='Event Name'
                            placeholder='event name'
                            value={eventName}
                            onChange={this.handleEventTitleChange}
                        />
                        {/* <Form.Field
                            required
                            name='start'
                            control={Input}
                            label='Start Time'
                            placeholder='Start time'
                            value={startTime}
                            onChange={this.handleEventStartChange}
                        />
                        <Form.Field
                            required
                            name='end'
                            control={Input}
                            label='End Time'
                            placeholder='End time'
                            value={endTime}
                            onChange={this.handleEventEndChange}
                        /> */}
                        {SelectedEventDateTime}
                        
                        <Form.Field
                            name='desc'
                            control={TextArea}
                            maxLength={550}
                            style={{resize: 'none'}}
                            label='Description'
                            placeholder='Description'
                            value={description}
                            onChange={this.handleEventDescChange}
                        />
                        <Form.Field
                            control={Button}
                            positive
                            content='Update Event'
                        />
                            
                    </Form>
                    
                    <Button negative style={{position: 'absolute', bottom: "5%", right: '5%'}} onClick={this.handleDeleteEventClick}>Delete Event</Button>   
                    
                    <Button style={{position: 'absolute', top: "5%", right: '5%'}} onClick={() => this.closeModifyModal()}>Cancel</Button>               
                </div>
        }    
        


        return (
            <div>
                <Confirm
                    open={this.state.removeConfirmOpen}
                    content='Are you sure you want to remove this event?'
                    onCancel={this.handleRemoveConfirmCancel}
                    onConfirm={(event) => this.handleRemoveConfirmConfirmed(event)}
                />
                <Modal visible={this.state.modifyModalOpen} width="50%" height="85%" effect="fadeInUp" onClickAway={() => this.closeModifyModal}>
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
                    style={{height: 700, width: 1500}}
                />  
            </div>
        );
    }
}

export default Calendar;