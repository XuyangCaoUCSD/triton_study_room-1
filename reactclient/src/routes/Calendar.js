import React, {Component} from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment'
import API from '../utilities/API';

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
                // {
                //     'title': 'ABOUT NOW',
                //     'start': new Date('November 24, 2019 20:30:00'),
                //     'end': new Date('November 24, 2019 21:40:00'),
                //     desc: 'BLAH'
                // },
                // {
                //     'title': 'TONIGHT',
                //     'start': new Date('November 24, 2019 22:20:00'),
                //     'end': new Date('November 24, 2019 23:40:00'),
                //     desc: 'BLAH'
                // }
            ]
        }

        this.addEventAPI = this.addEventAPI.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
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

            if (this._isMounted) {
                this.setState({
                    events: data.events
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

    handleSelect = ({ start, end }) => {
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
    
    addEventAPI(newEvent) {
        console.log('Calling API to add event');
        let data = {
            patchType: 'add',
            calendarEvent: newEvent // {...newEvent}
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
                    title: responseEvent.eventName,
                    start:  responseEvent.startTime,
                    end: responseEvent.endTime,
                }

                let newEventsArr = [...this.state.events, newEvent]
                this.setState({
                    events: newEventsArr,
                });
                // this.setState({
                //     events: [
                //         ...this.state.events,
                //         {
                //             start,
                //             end,
                //             title,
                //         },
                //     ],
                // });
            }    
            
        }).catch((err) => {
            console.log("Error while making patch request to calendar route, logging error: \n" + err);
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
        
        return (
            <div>
                <BigCalendar
                    culture='en-US'
                    events={this.state.events}
                    step={5}
                    timeslots={12}
                    selectable
                    onSelectEvent={event => alert(event.title)}
                    onSelectSlot={this.handleSelect}
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