import React, {Component } from 'react';
import { Button, Dropdown } from 'semantic-ui-react';
import API from '../utilities/API';
import Loading from "../Loading";

class InviteFriends extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filteredFriendsOptions: [
            ],
            selectedFriendEmail: "",
            selectedFriendName: ""
        }

        this.handleInviteFriend = this.handleInviteFriend.bind(this);
        this.getFilteredFriends = this.getFilteredFriends.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;

        this.getFilteredFriends();
    }


    componentWillUnmount() {
        this._isMounted = false;
    }

    handleFriendSelectOnMouseUp = (e) => {
        this.setState({
            selectedFriendEmail: e.currentTarget.getAttribute('email'),
            selectedFriendName: e.currentTarget.getAttribute('user-name')
        })

    }

    handleInviteFriend() {
        if (!this.state.selectedFriendEmail) {
            console.log('Need to select something to join'); 
            return;
        }

        let data = {
            inviteeEmail: this.state.selectedFriendEmail
        }

        API({
            method: 'patch',
            url: `/api/namespace${this.props.endpoint}/selected-invitee`,
            withCredentials: true,
            data
        }).then((res) => {
            let data = res.data;
            if (!data.success) {
                console.log('Failed API to add user to namespace');
            }

            if (this._isMounted) {
                this.setState({
                    selectedFriendEmail: "",
                    selectedFriendName: ""
                })

                this.getFilteredFriends();
            }

        }).catch((err) => {
            console.log(err);
        });
    }

    getFilteredFriends() {
        if (!this.props.endpoint) {
            console.log('NEED ENDPOINT TO FILTER FRIENDS');
            return;
        }

        API({
            method: 'get',
            url: `/api/namespace${this.props.endpoint}/get-potential-list`,
            withCredentials: true
        }).then((res) => {
            console.log('Getting filtered friends, Server responded with:');
            console.log(res);

            let data = res.data;
            if (!data.success) {
                console.log('Failed API call');
                return;
            }
            
            let filteredFriends = data.potentialList;

            let filteredFriendsOptions = filteredFriends.map((friend) => {
                return {
                    key: friend.email,
                    value: friend.email,
                    email: friend.email,
                    "user-name": friend.name,
                    image: { avatar: true, src: friend.avatar },
                    text: friend.name,
                    onMouseUp: this.handleFriendSelectOnMouseUp // Don't override existing onclick
                }
            });

            if (this._isMounted) {
                this.setState({
                    filteredFriendsOptions
                });
            }

        }).catch((err) => {
            console.log("Error while getting filtered friends route, logging error: \n" + err);
            if (!err) {
                console.log('Could not confirm error type from server');
                return;
            }
            let statusCode = err.response.status.toString();
            if (statusCode === "401") {
                console.log("ERROR code 401 received - UNAUTHENTICATED");
                this.props.history.push("/login/error");
            } else if (statusCode === "403") { 
                console.log("ERROR code 403 received - UNAUTHORISED CREDENTIALS");
                if (this._isMounted) {
                    this.setState({
                        unauthorised: true
                    })
                }
            }

        });
    }

    render() {
        if (this.state.filteredFriends) {
            return <Loading type="spinningBubbles" color="#0B6623" />;
        }

        let inviteFriendButton = <Button primary disabled onClick={this.handleInviteFriend}>Invite</Button>;

        if (this.state.selectedFriendEmail) {
            inviteFriendButton = <Button primary onClick={this.handleInviteFriend}>Invite</Button>;
        }



        return (
            <div className='ui grid' style={{height: "100%", width: '100%'}}>
                <div className='column'>

                </div>
                <div className='five wide column'>
                    <div className='row'>
                        <div className='five wide column'>
                            <br></br>
                            <h3>Find a friend to invite</h3>
                        </div>
                    </div>

                    <div className='row'>
                        <div className='three wide column'>
                            <Dropdown
                                placeholder='Select a friend'
                                search
                                fluid
                                selection
                                closeOnEscape
                                text={this.state.selectedFriendName}
                                options={this.state.filteredFriendsOptions}
                            /> 
                        </div>
                        <div className='two wide column' >
                            {inviteFriendButton}
                        </div>
                    </div>
                </div>
                
            </div>
            
        );  
    }
}

export default InviteFriends;


