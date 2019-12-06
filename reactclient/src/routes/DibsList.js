import React, { Component } from "react";
import API from '../utilities/API';
import {CommentText, Header, Segment, TextArea} from "semantic-ui-react";

export default class DibsList extends Component {

    constructor( props ) {
        super( props );
        this.state = ( { user_db_id:"5dd1bae0ff6c0a438b3deee6", roomHours: [] } );
        this._isMounted = false;
        this.fetch_data = this.fetch_data.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
        this.fetch_data();
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    fetch_data() {
        API({
            // assemble HTTP get request
            method: 'get',
            url: '/api/dibsAllRooms',
            withCredentials: true
        }).then( rooms => {

            let loadPromises = [];
            let hours = [];
            let now = new Date();
            for( const room of rooms.data )
                loadPromises.push(
                    API({
                        // assemble HTTP get request
                        method: 'post',
                        url: '/api/dibsAvailableHours',
                        withCredentials: true,
                        data: {
                            room_id: room.room_id,
                            year: now.getFullYear(),
                            month: now.getMonth() + 1,
                            day: now.getDate()
                        }
                    })
                    .then( hourResponse => {
                        hours.push( ...hourResponse.data );
                    } )
                    .catch( error => console.log( "Could not load hours for room " + room.room_id ) )
                );

            Promise.allSettled( loadPromises )
                   .finally( () => {
                       if( this._isMounted ) this.setState( {roomHours: hours} )
                   } )

        }).catch( error => console.log( "error when submitting: " + error ) );
    }

    render() {

        const {roomHours} = this.state;

        return (
            <div className="ui segment container">
                <div className="ui relaxed divided items">


                    { roomHours.map( roomHour => (
                        <Segment key={roomHour.room.id}>
                            <Header>{roomHour.room.name}</Header>
                            <CommentText>{"From: " + new Date( roomHour.start ).toLocaleString()}</CommentText>
                            <CommentText>{"To: " + new Date( roomHour.end ).toLocaleString()}</CommentText>
                        </Segment>
                    ))}

                </div>
            </div>
        );
    }
}