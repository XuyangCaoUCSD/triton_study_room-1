import React, {Component} from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment'

 


class Calendar extends Component {
    constructor(props, context) {
        super(props, context);

        this.localizer = momentLocalizer(moment);
        this.state = {
            events:  [
                {
                    'title': 'All Day Event very long title',
                    'allDay': true,
                    'start': new Date('November 26, 2019 11:13:00'),
                    'end': new Date('November 26, 2019 12:13:00'),
                },
                {
                    'title': 'OLD EVENT',
                    'allDay': true,
                    'start': new Date('November 26, 2018 11:13:00'),
                    'end': new Date('November 26, 2018 23:13:00'),
                },
                {
                    'title': 'Long Event',
                    'start': new Date('November 26, 2019 11:13:00'),
                    'end': new Date('November 27, 2019 11:13:00')
                },
                {
                    'title': 'SOMETHING STARTS',
                    'start': new Date('November 24, 2019 11:13:00'),
                    'end': new Date('November 24, 2019 12:15:00'),
                    desc: 'BLAH'
                },
                {
                    'title': 'ABOUT NOW',
                    'start': new Date('November 24, 2019 20:30:00'),
                    'end': new Date('November 24, 2019 21:40:00'),
                    desc: 'BLAH'
                },
                {
                    'title': 'TONIGHT',
                    'start': new Date('November 24, 2019 22:20:00'),
                    'end': new Date('November 24, 2019 23:40:00'),
                    desc: 'BLAH'
                }
            ]
        }
    }

    handleSelect = ({ start, end }) => {
        const title = window.prompt('New Event name')
        if (title)
          this.setState({
            events: [
                ...this.state.events,
                {
                    start,
                    end,
                    title,
                },
            ],
        })
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