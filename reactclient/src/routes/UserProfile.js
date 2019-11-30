import React, { Component } from "react";
import API from '../utilities/API';
import {Header} from "semantic-ui-react";

export default class UserProfile extends Component {

    constructor( props ) {
        super( props );
        this.state = ( { user_db_id:"5dd1bae0ff6c0a438b3deee6", target_user_db_id:"5dd1bae0ff6c0a438b3deee6", userData: {} } );
        this._isMounted = false;
        this.fetch_data = this.fetch_data.bind(this);
        this.handleAddFriend = this.handleAddFriend.bind(this);
        this.handleRemoveFriend = this.handleRemoveFriend.bind(this)
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
            url: "/api/userSearch",
            withCredentials: true,
            data: {
                user_db_id: this.state.target_user_db_id,
            }
        }).then( (response) => {
            // extract the data from the body of response
            console.log("data successfully retrieved from backend!");
            if( this._isMounted ) {
                this.setState({ userData: response.data[0] });
            }
            console.log(this.state);
        }).catch( (error) => {
            // otherwise some error occurs
            console.log("error when submitting: "+error);
        });
    }

    handleAddFriend() {
        // assemble HTTP post request
        // put the updated value (with user id) into the request body in the form of json
        API({
            method: 'post',
            url: "/api/userAdd",
            withCredentials: true,
            data: {
                send_to_id: this.state.target_user_db_id,
                user_db_id: this.state.user_db_id
            }
        }).then((response) => {
            // check what our back-end Express will respond (Does it receive our data?)
            console.log(response.data);
            alert("A friend request has been sent to "+this.state.userData.title+"!");
        }).catch((error) => {
            // if we cannot send the data to Express
            console.log("error when submitting: "+error);
            alert("Could not add friend.");
        });

    }

    handleRemoveFriend() {
        //TODO remove friend logic
    }

    render() {

        const {userData} = this.state;
        var friendAction;

        if( !userData.is_friend )
            friendAction =
                <div className="ui right floated primary button">
                    Add Friend
                    <i className="right plus icon"/>
                </div>;
        else if( this.state.user_db_id !== this.state.target_user_db_id )
            friendAction =
                <div className="ui right floated negative button">
                    Remove Friend
                    <i className="right minus icon"/>
                </div>;
        else friendAction =
                <div className="ui right floated disbaled button">
                    Yourself
                </div>;

        return (
            <div className="ui segment container">
                <div className="ui relaxed divided items">


                    <div className="item">
                        <div className="ui small rounded image">
                            <img src={userData.avatar} alt="avatar"/>
                        </div>
                        <div className="content">
                            <Header>{userData.title}</Header>
                            <div className="meta">
                                <a href={"mailto:"+userData.email}><i className="ui mail icon"/> {userData.email}</a>
                            </div>
                            <div className="description">{userData.about_me}</div>
                            {friendAction}
                        </div>
                    </div>

                </div>
            </div>
        );
    }
}