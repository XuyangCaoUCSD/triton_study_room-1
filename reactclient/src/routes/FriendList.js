// front-end underlying technology: React
import React, {Component} from 'react';
// we use axios for data communication between front-end and back-end
import { Button, Checkbox, Form, Image, List, Modal, Label, Grid, Icon } from 'semantic-ui-react'

import API from '../utilities/API';

import userSearch from './UserSearch';
import UserSearch from './UserSearch';

export default class FriendList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            friendlist: [],
            myEmail: ""
        }

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
            // again include the user id so our backend will know who you are
            method: 'get',
            url: "/api/userSearch/friend",
            withCredentials: true,
        }).then((response) => {
            // extract the data from the body of response
            console.log("data successfully retrieved from backend!");
            console.log(response.data);
            if (this._isMounted) {
                // assign what we received to the state variables which will be rendered
                this.setState({friendlist: response.data});
            }
            
        }).catch((error) => {
            // otherwise some error occurs
            console.log("error when submitting: "+error);
        });

        API({
            // assemble HTTP get request
            // again include the user id so our backend will know who you are
            method: 'get',
            url: "/api/simpleEmailRetrieve",
            withCredentials: true,
        }).then((response) => {
            // extract the data from the body of response
            console.log("data successfully retrieved from backend!");
            console.log(response.data);
            if (this._isMounted) {
                // assign what we received to the state variables which will be rendered
                this.setState({myEmail: response.data.myEmail});
            }
            
        }).catch((error) => {
            // otherwise some error occurs
            console.log("error when submitting: "+error);
        });
    }

    generateFriendList() {
        const friendItems = [];
        for(var i = 0; i < this.state.friendlist.length; i++) {
            friendItems.push(
                <Modal
                    closeIcon
                    size='small'  
                    trigger={
                        <List.Item key={i} as="a">
                            <Image avatar src={this.state.friendlist[i].avatar} />
                            <List.Content>
                            <List.Header >{this.state.friendlist[i].title}</List.Header>
                            <List.Description>
                                {this.state.friendlist[i].email}
                            </List.Description>
                            </List.Content>
                        </List.Item>
                    }
                >
                <Modal.Header>{this.state.friendlist[i].title}</Modal.Header>
                <Modal.Content image>
                    <Image wrapped size='medium' src={this.state.friendlist[i].avatar} />
                    <Modal.Description>
                    <List>
                          <List.Item>
                          <List.Icon name='user' />
                          <List.Content>{this.state.friendlist[i].title}</List.Content>
                          </List.Item>
                          <List.Item>
                          <List.Icon name='mail' />
                          <List.Content><a href={'mailto:'+this.state.friendlist[i].email}>{this.state.friendlist[i].email}</a></List.Content>
                          </List.Item>
                          <List.Item>
                          <List.Icon name='smile' />
                          <List.Content>
                              <p>{this.state.friendlist[i].about_me ? this.state.friendlist[i].about_me : 'The user has not written "about me" yet.'}</p>
                          </List.Content>
                          </List.Item>
                      </List>
                      <Label size="large">A friend of yours</Label>
                      <br /><br />
                      <Button name={this.state.friendlist[i].email} onClick={this._clickDirectMessage}>Direct message</Button>
                    </Modal.Description>
                </Modal.Content>
            </Modal>

            );
        }

        return friendItems;
    }

    _clickDirectMessage = (e) => {
        const myEmail = this.state.myEmail;
        const friendEmail = e.target.name;
        console.log(myEmail);
        console.log(friendEmail);

        let data = {
            privateChat: true,
            secondUserEmail: friendEmail
        }

        API({
            method: 'post',
            url: "/api/namespace",
            withCredentials: true,
            data
        }).then((res) => {
            console.log('Post request to namespace for private message response is:');

            let data = res.data;
            console.log('data is');
            console.log(data);

            if (!data.success) {
                console.log('Error/failure encountered');
                return;
            }

            this.props.history.push(`/namespace${data.group.endpoint}`);
            // window.location.reload(); // Force reload to force rerender as using same Namespace class instance

            
        }).catch((err) => {
            console.log(err);
        });

    }


    render() {
        return(
            <Grid>
                <Grid.Column width={3}>
                    <h3>Friend List</h3>
                    <List animated selection>
                        {this.generateFriendList()}
                    </List>
                </Grid.Column>
                <Grid.Column width={3}>
                    <h3>Search to add a friend <Icon name="user plus"></Icon></h3>
                    <UserSearch />
                </Grid.Column>
            </Grid>


        );
    }



}


