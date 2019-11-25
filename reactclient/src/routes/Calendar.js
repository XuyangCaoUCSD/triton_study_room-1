import React, {Component} from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment'

 


class Calendar extends Component {
    constructor(props, context) {
        super(props, context);

        this.localizer = momentLocalizer(moment);

    }

    render() {
        let events =  [
            {
                'title': 'All Day Event very long title',
                'allDay': true,
                'start': new Date('November 26, 2019 11:13:00'),
                'end': new Date('November 26, 2019 12:13:00'),
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
        return (
            <div>
                <BigCalendar
                    culture='en-US'
                    events={events}
                    views={['month', 'week', 'day']}
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