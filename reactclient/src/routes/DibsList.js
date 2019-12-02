import React, { Component } from "react";
import API from '../utilities/API';
import {CommentText, Header, Segment, TextArea} from "semantic-ui-react";

export default class DibsList extends Component {

    constructor( props ) {
        super( props );
        this.state = ( { user_db_id:"5dd1bae0ff6c0a438b3deee6", roomData: [] } );
        this._isMounted = false;
        this.fetch_data = this.fetch_data.bind(this);
    }

    componentDidMount() {
        this.fetch_data();
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    fetch_data() {
        API({
            // assemble HTTP get request
            method: 'get',
            url: "/api/dibsRooms",
            withCredentials: true
        }).then( (response) => {
            // extract the data from the body of response
            console.log("data successfully retrieved from backend!");
            if( this._isMounted ) {
                this.setState({ roomData: response.data } );
            }
            console.log(this.state);
        }).catch( (error) => {
            // otherwise some error occurs
            console.log("error when submitting: "+error);
        });
    }

    render() {

        const {roomData} = this.state;

        return (
            <div className="ui segment container">
                <div className="ui relaxed divided items">


                    { this.state.roomData.map( room => (
                        <Segment>
                            <CommentText>{room.BuildingName}</CommentText>
                            <img src={room.Picture}/>
                            <CommentText>{room.Name}</CommentText>
                        </Segment>
                    ))}

                </div>
            </div>
        );
    }
}