import React, {Component} from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import { Button, Form, Input, Select, Confirm, TextArea, Icon } from 'semantic-ui-react';
import API from '../utilities/API';
import Modal from 'react-awesome-modal';
import DateTimeRangeContainer from 'react-advanced-datetimerange-picker';

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
                    location: eventInfo.location,
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
        // const title = window.prompt('New Event name')
        // if (title) {
        //     let newEvent = {
        //         start,
        //         end,
        //         title
        //     }
            
        //     this.addEventAPI(newEvent);
        // }
        console.log('Start is');
        console.log(start);
        console.log('end is');
        console.log(end);
        let currentEventStart = moment(start);
        let currentEventEnd = moment(end);
        let currentEvent = {};

        this.setState({
            createModalOpen: true,
            currentEventStart,
            currentEventEnd,
            currentEvent
        }); 
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

    closeCreateModal = () => {
        this.setState({
            createModalOpen: false
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
                    location: responseEvent.location,
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

    handleCreateEventSubmit = (e) => {
        e.preventDefault();

        console.log('e.target is');
        console.log(e.target);

        let newEvent = {
            start: new Date(this.state.currentEventStart),
            end: new Date(this.state.currentEventEnd),
            title: e.target.elements.title.value,
            desc: e.target.elements.desc.value,
            location: e.target.elements.location ? e.target.elements.location.value : null
        }

        console.log('new event is');
        console.log(newEvent);
        
        this.addEventAPI(newEvent);
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

    // Triggered when click create event button
    handleCreateEventOpen = (e) => {
        // Default start and end for new event
        let now = new Date();
        let currentEventStart = moment(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0,0));
        let currentEventEnd = moment(currentEventStart).add(1, "days").subtract(1, "seconds");
        let currentEvent = {};

        this.setState({
            createModalOpen: true,
            currentEventStart,
            currentEventEnd,
            currentEvent
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
                    location: responseEvent.location,
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
                        createModalOpen: false
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
        let maxDate = moment(currentTime).add(3, "years"); // max is 3 years from now
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

        // Modal for modify or update
        let modalContent = null;

        if (this.state.currentEvent) {
            let description = this.state.currentEvent.desc ? this.state.currentEvent.desc : "";
            let eventName = this.state.currentEvent.title ? this.state.currentEvent.title : "";
            // Text different for update or Modify
            let headerText = this.state.modifyModalOpen ? "Modify event" : "Create event";
            let submitButtonText = this.state.modifyModalOpen ? "Update event" : "Create event";

            let submitHandler = this.state.modifyModalOpen ? this.handleModifyEventSubmit : this.handleCreateEventSubmit;
            let cancelFunction = this.state.modifyModalOpen ? this.closeModifyModal : this.closeCreateModal;

            modalContent = 
                <div style={{padding: '1em'}}>
                    <h1>{headerText}</h1>
                     <Form onSubmit={submitHandler}>
                        <Form.Field
                            required
                            name='title'
                            control={Input}
                            label='Event Name'
                            placeholder='event name'
                            value={eventName}
                            onChange={this.handleEventTitleChange}  
                        />

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
                            content={submitButtonText}
                        />
                            
                    </Form>
                    
                    {/* Do not show delete button when creating event */}
                    {this.state.modifyModalOpen && <Button negative style={{position: 'absolute', bottom: "5%", right: '5%'}} onClick={this.handleDeleteEventClick}>Delete Event</Button>} 
                    
                    <Button style={{position: 'absolute', top: "5%", right: '5%'}} onClick={() => cancelFunction()}>Cancel</Button>               
                </div>
        }    
        
        

        return (
            <div>
                <Button icon labelPosition='left' primary style={{position: 'absolute', top: "3.6%", right: '28%'}} onClick={this.handleCreateEventOpen}>
                    <Icon name='add to calendar'></Icon>
                    Add an event
                </Button> 
                <Confirm
                    open={this.state.removeConfirmOpen}
                    content='Are you sure you want to remove this event?'
                    onCancel={this.handleRemoveConfirmCancel}
                    onConfirm={(event) => this.handleRemoveConfirmConfirmed(event)}
                />
                <Modal visible={this.state.modifyModalOpen} width="50%" height="85%" effect="fadeInUp" onClickAway={() => this.closeModifyModal()}>
                    {modalContent}
                </Modal>
                <Modal visible={this.state.createModalOpen} width="50%" height="85%" effect="fadeInUp" onClickAway={() => this.closeCreateModal()}>
                    {modalContent}
                </Modal>
                <BigCalendar
                    culture='en-US'
                    events={this.state.events}
                    step={10}
                    timeslots={6}
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