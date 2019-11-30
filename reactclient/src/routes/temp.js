
import React, {Component} from 'react';
// we use axios for data communication between front-end and back-end
import { Button, Checkbox, Form, Image, Grid, List, Label } from 'semantic-ui-react'

import API from '../utilities/API';

export default class StudySessionCreation extends Component {
    constructor(props) {
        super(props);

        this.state = {
            startPoint: null,
            endPoint: null
        }

        this._startPointSelected = this._startPointSelected.bind(this);
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

    componentDidMount() {
        this._isMounted = true;
        this.currentPoint = new Date();
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    _startPointSelected(event) {
        if(this._isMounted) {
            const selectedDateObject = this.generateDateObject(event.target.value);
            //value is good
            console.log(selectedDateObject);

            //compare to make sure the start time is after the current time
            if(selectedDateObject.getTime() < this.currentPoint.getTime()) {
                alert("Your selected start time is before current time! Please reselect.");
            }
        }
    }

    render() {
        return(
            <div class="setting-form">
                <Form>
                    <input type="datetime-local" id="start-point"
                    name="start-point" style={{maxWidth:300}}
                    onChange={this._startPointSelected}></input>
                </Form>
                <h3>start time is {this.state.startPoint}</h3>
            </div>
        
        );
    }


}