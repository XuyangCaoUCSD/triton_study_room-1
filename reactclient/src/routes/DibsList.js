import React, { Component } from "react";
import API from '../utilities/API';
import {CommentText, Header, Segment, TextArea} from "semantic-ui-react";
import GoogleMapReact from "google-map-react";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";

export default class DibsList extends Component {

    constructor( props ) {
        super( props );
        this.state = ( { user_db_id:"5dd1bae0ff6c0a438b3deee6", buildings: [] } );
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
            url: '/api/dibsAllBuildings',
            withCredentials: true
        }).then( (response) => {
            // extract the data from the body of response
            console.log("data successfully retrieved from backend!");
            console.log(response.data);
            if( this._isMounted ) {
                this.setState({ buildings: response.data } );
            }
        }).catch( (error) => {
            // otherwise some error occurs
            console.log("error when submitting: "+error);
        });
    }

    render() {

        const {buildings} = this.state;

        return (
            <div className="ui segment container">
                <div className="ui relaxed divided items">


                    { buildings.map( building => (
                        <Segment key={building.building_id}>
                            <Header>{building.name}</Header>
                        </Segment>
                    ))}

                </div>
            </div>
        );
    }
}