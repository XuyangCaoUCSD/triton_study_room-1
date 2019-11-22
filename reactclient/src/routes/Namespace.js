import React, {Component} from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import API from '../utilities/API';
// import Room from '../Room';
import io from 'socket.io-client';
import { Segment, Form, TextArea, Message, List, Image, Header, Icon, Popup, Button, Label, Menu } from 'semantic-ui-react';
import Loading from "../Loading";
import ChatGroupIcon from '../ChatGroupIcon';

class Namespace extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inputMessageValue: '',
            endpoint: this.props.match.params.name,  // TODO, currently no preceding '/'
            namespaceNameParam: this.props.match.params.name,
            roomNotifications: this.props.roomNotifications ? this.props.roomNotifications : {}
        };

        this.namespaceHTML = this.namespaceHTML.bind(this);

        this.handleInputChange = this.handleInputChange.bind(this);
        this.componentCleanup = this.componentCleanup.bind(this);

        // Don't actually need to bind this to arrow functions
        this.messageInputHandler = this.messageInputHandler.bind(this);
        this.joinRoom = this.joinRoom.bind(this);
        this.buildRoom = this.buildRoom.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
        // For cleaning up when refreshing
        window.addEventListener('beforeunload', this.componentCleanup);

        // Retrieve particular namespace information
        API({
            method: 'get',
            url: `/api/namespace/${this.state.endpoint}`,
            withCredentials: true
        }).then((res) => {
            console.log('Get on Namespace route, Server responded with:');
            console.log(res);

            let data = res.data;
            console.log(data);

            // Avoid memory leak
            if (!this._isMounted) {
                return;
            }

            if (!data.success) {
                console.log('ERROR on server, likely because namespace does not exist');
                this.setState({
                    nameSpaceNonExistent: true
                })
                return;
            }
            
            let chatGroups = data.nsData;
            let currRoom = data.currRoom;

            let currNs = data.currNs;
            let roomNotifications = data.roomNotifications;
            
            this.setState({
                rooms: currNs.rooms,
                currRoom: currRoom,  // Joins first room by default
                groupName: currNs.groupName,
                roomNotifications,
                chatGroups,
            });


            // this.socket = io.connect(`/namespace${cse110Namespace.endpoint}`, {transports: ['websocket']});

            if (this.socket != null) {
                console.log('disconnecting before reconnecting');
                this.socket.removeAllListeners('userMessage');
                this.socket.disconnect();
            }
            
            // this.socket = io.connect(`http://localhost:8181/namespace${this.state.endpoint}`); 
            // Need full path for now to avoid warning
            this.socket = io.connect(`http://localhost:8181/namespace/${this.state.endpoint}`);

            console.log('just called connect');
            console.log(this.socket);

            // Only add listeners once
            this.socket.on('connect', this.onSocketConnectCB);
            this.socket.on('userMessage', this.onSocketMessageCB);
            this.socket.on('changeRoom', this.onSocketChangeRoomCB);
            this.socket.on('updateActiveUsers', this.onSocketUpdateActiveUsersCB);
            this.socket.on('roomNotification', this.onSocketRoomNotificationCB)

            console.log(`client socket connecting to /namespace/${this.state.endpoint}`);

            this.scrollToBottom(true);

        }).catch((err) => {
            console.log("Error while getting Namespace route, logging error: \n" + err);
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
    
    componentCleanup() {
        console.log('Cleanup called');
        if (this.socket != null) {
            console.log('Disconnecting socket');
            // this.socket.removeAllListeners('connect');
            // this.socket.removeAllListeners('userMessage');
            // this.socket.removeAllListeners('connecting');
            this.socket.on('disconnect', () => {
                console.log('Confirmed disconnect on client side');
            });
            
            // this.socket.removeAllListeners('disconnect');

            this.socket.disconnect();

            this.socket = null;
        }
    }

    componentWillUnmount() {
        console.log('Calling will unmount');
        this.componentCleanup();
        window.removeEventListener('beforeunload', this.componentCleanup);
        this._isMounted = false;
    }
    
    componentDidUpdate() {
        this.scrollToBottom();
    }

    // Scroll to last message
    scrollToBottom = (forceScroll) => {
        // "Auto" to get there immediately. TODO when to use auto, when to use smooth, when to not scroll. 
        setTimeout(() => {
            if (this.messagesEnd && (forceScroll || this.state.userNearBottom)) {
                this.messagesEnd.scrollIntoView({ behavior: "smooth" });
            }
        }, 50)        
    }

    handleMessageScroll = (e) => {
        // Determine if user is near bottom of messages box
        let threshold = 150;
        const bottom = e.target.scrollHeight - e.target.scrollTop - threshold < e.target.clientHeight;
        if (bottom) {
            if (!this.state.userNearBottom) {
                this.setState({
                    userNearBottom: true
                });
            }
        } else {
            if (this.state.userNearBottom ) {
                this.setState({
                    userNearBottom: false
                })
            }
        }
    }

    messageInputHandler = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const message = this.state.inputMessageValue; // Get value from state as input used is controlled component
            this.setState({
                inputMessageValue: '' // clear text area
            });
            console.log('message is ');
            console.log(message);

            this.scrollToBottom(true);
            
            // Do this.socket emit
            if (this.socket != null) {
                this.socket.emit('userMessage', message);
            } else {
                console.log('ERROR: No socket to emit message');
            }
        } 
    }

    // Hanldes message input change
    handleInputChange(e) {
        this.setState({
            inputMessageValue: e.target.value
        })
    }

    //------------------- Socket callbacks (can be externalised into another file eventually)----------
    onSocketConnectCB = () => {
        console.log('Socket connected!');
    }

    onSocketMessageCB = (msg) => {
        console.log(this.state.currRoom);
        let chatHistory = {...this.state.currRoom.chatHistory}; // assume immutable, make copy

        chatHistory.messages = [...chatHistory.messages, msg];

        let newCurrRoom = {...this.state.currRoom};
        newCurrRoom.chatHistory = chatHistory;
        
        this.setState({
            currRoom: newCurrRoom
        });
    }

    onSocketChangeRoomCB = (newRoom) => {
        this.setState({
            currRoom: newRoom
        });
    }

    onSocketUpdateActiveUsersCB = (activeUsers) => {
        this.setState({
            activeUsers
        });
        console.log('Active Users are:');
        console.log(activeUsers);
    }

    onSocketRoomNotificationCB = (roomName) => {
        console.log('Received roomNotification for room ' + roomName);
        this.updateRoomNotifications(roomName, true);
    }
    // ---------------- End of socket callbacks --------------------


    // ----------- Handles change of namespace ----------
    iconsClickHandler = (data) => {
        console.log('data in icons click handler is');
        console.log(data);

        console.log(`pushing /namespace${data.endpoint} to history`);
        // Temp, make it like dashboard where we use redirect
        this.props.history.push(`/namespace${data.endpoint}`);
        window.location.reload(); // Force reload to force rerender as using same Namespace class instance

        // // Get request to get info for current namespace
        // API({
        //     method: 'get',
        //     url: `/api/namespace${data.endpoint}`,
        //     withCredentials: true
      
        // })
        // .then((res) => {
        //     console.log(`/api/namespace${data.endpoint} API responded with`);
        //     console.log(res);
        //     if (this._isMounted) {
        //         this.setState({
        //             redirectTo: `/namespace${data.endpoint}`
        //         });
        //     }
            
        // })
        // .catch((err) => {
        //     console.log(err);
        //     console.log(`Err in getting /api/namespace${data.endpoint} info`);
        // });
    }

    // // Handles change of param (as will reach the same Namespace class instance, need to force rerender)
    // static getDerivedStateFromProps(nextProps, prevState) {
    //     if (nextProps.match.params.name !== prevState.namespaceNameParam){
    //         return {
    //             inputMessageValue: '',
    //             currRoomNumActive: 0,
    //             socketConnected: false, // Not used atm
    //             endpoint: nextProps.match.params.name,  // TODO, currently no preceding '/'
    //             namespaceNameParam: nextProps.match.params.name
     
    //         }
    //     }
    //     return null;
    // }

    // -------------- End of namespace change functions-----------

    // Handles click on other rooms
    joinRoom = (e) => {
        // Remove room notifications for room just left just in case somehow still there
        this.updateRoomNotifications(this.state.currRoom.roomName, false);

        let roomName = e.target.innerText;
        console.log('room to join is ' + roomName);
        // Remove notifications if there was one for the room just joined
        this.updateRoomNotifications(roomName, false);

        this.socket.emit('joinRoom', roomName);
        
    }

    updateRoomNotifications = (roomName, hasNotification) => {
        // If user already in room, always turn off notification
        if (this.state.currRoom.roomName === roomName) {
            hasNotification = false;
        }

        let roomNotifications = {...this.state.roomNotifications};
        roomNotifications[roomName] = hasNotification;
        this.setState({
            roomNotifications
        });
    }

    render() {
        if (this.state.unauthorised) {
            return (
                <Message negative>
                    <Message.Header>UNAUTHORISED ERROR</Message.Header>
                    <p>{"You are not authorised to be here!"}</p>
                </Message>
            );

        } 
        else if (this.state.nameSpaceNonExistent) {
            return (
                <Message negative>
                    <Message.Header>INVALID GROUP {this.state.namespaceNameParam.toUpperCase()}</Message.Header>
                    <p>{this.state.namespaceNameParam.toUpperCase()} does not exist!</p>
                </Message>
            );   
        }
        else if (this.state.rooms != null) {
            // TODO, make it so that room and namespaces in this part shouldn't have to reload every keystroke

            // These info should only be loaded once when component mounts.
            // Only messages will be updated after that

            let rooms = [];
            const roomsInfo = this.state.rooms;
            // grab each group and its value which is endpoint
            // Object.entries returns an array of key value pairs
            Object.entries(roomsInfo).forEach(([key, roomInfo]) => {
                // Push rooms onto array
                rooms.push(this.buildRoom(roomInfo, key));
            });
            
            let chatGroupIcons = [];
            const chatGroupsInfo = this.state.chatGroups;
            // grab each group and its value which is endpoint
            // Object.entries returns an array of key value pairs
            Object.entries(chatGroupsInfo).forEach(([key, value]) => {
                // Push chat group icon component onto array
                chatGroupIcons.push(<ChatGroupIcon key={key} data={value} onClickHandler={() => this.iconsClickHandler(value)} />);
            });  
            
            let chatHistory = [];
            // chatHistory.push(buildMessage("Hello There"));
            // chatHistory.push(buildMessage("Lorem Ipsum"));
            // chatHistory.push(buildMessage("Pig latin"));
            if (this.state.currRoom && this.state.currRoom.chatHistory != null) {
                let key = 0;
                this.state.currRoom.chatHistory.messages.forEach((message) => {
                    chatHistory.push(buildMessage(message, key));
                    key += 1
                })
            }

            let activeUsersList = [];
            if (this.state.activeUsers) {
                let activeUsersInfo = Object.values(this.state.activeUsers);
                let key = 0;
                activeUsersInfo.forEach((userInfo) => {
                    activeUsersList.push(buildActiveUser(userInfo, key));
                    key += 1
                });
            }

            return (
                // TODO make outer one screen (height: "100vh", width: "100vw")
                // TODO appropriate inner divs 100% width and height instead of having to nest

                <div className="ui container" style={{height: "75vh", width: "100vw"}}>
                    <h2>{this.state.groupName}</h2>
                    {this.namespaceHTML(chatGroupIcons, rooms, chatHistory, activeUsersList)}
                </div>
            );
           
        } else {
            return <Loading type="spinningBubbles" color="#0B6623" />;
        }
        
    }

    namespaceHTML(chatGroups, rooms, messages, activeUsersList) {
        return (
            <div className="ui grid" style={{height: "100%", width: '100%'}}>
                <div className="two wide column namespaces">
                    <Menu compact icon='labeled' vertical>
                        {chatGroups}
                    </Menu>
                </div>
                <div className="two wide column rooms">
                    <h3>Channels <i aria-hidden="true" className="lock open small icon"></i></h3>
                    <List link>
                        {rooms}
                    </List>
                    {/* <ul className="room-list" style={{listStyleType: "none", padding: 0}}>
                        {rooms}
                    </ul> */}
                </div>
                <div className="ten wide column" style={{height: "100%", width: '100%'}}>
                    <div className="row">
                        <div className="three wide column">
                            <span className="curr-room-text">{this.state.currRoom.roomName} </span> 
                            <span className="curr-room-num-users">
                                <i aria-hidden="true" className="users disabled large icon"></i>
                            </span>
                        </div>
                        {/* <div className="three wide column ui search pull-right">
                            <input type="text" id="search-box" placeholder="Search" />
                        </div> */}
                    </div> 
                    <Segment onScroll={this.handleMessageScroll} color="teal" style={{overflowY: 'scroll', height: '100%', width: '100%', wordWrap: 'break-word'}}>
                        <ul id="messages" className="twelve wide column" style={{listStyleType: "none", padding: 0}}>
                            {messages}
                            {/* Dummy div below to use to scroll to bottom */}
                            <div style={{ float:"left", clear: "both" }} ref={(el) => { this.messagesEnd = el; }}>
                            </div>
                        </ul>
                    </Segment>
                    <div className="message-form" style={{width: '100%', paddingBottom: '15px'}}>
                        {/* <form className="ui-form" id="user-input" onSubmit={messageInputHandler} style={{width: '100%'}}>
                            <div className="ui input fluid icon" >
                                <input name="message" type="text" placeholder="Enter your message" maxLength="40000" style={{width: '100%', wordWrap: 'break-word'}}/>
                            </div>
                        </form> */}
                        <Form style={{width: '100%'}}>
                            <TextArea value={this.state.inputMessageValue} name="message" onChange={this.handleInputChange} style={{resize: 'none'}} onKeyDown={this.messageInputHandler} maxLength="40000" placeholder="Enter your message" rows="2" />
                        </Form>

                    </div>
                </div>
                <div className="two wide column" style={{height: "100%", width: '100%'}}>
                    <Header as='h4' textAlign='left'>
                        <Icon name='users' circular />
                        <Header.Content>Online In {this.state.namespaceNameParam.toUpperCase()}: {activeUsersList.length}</Header.Content>
                    </Header>
                    <List selection animated verticalAlign='middle'>
                        {activeUsersList}
                    </List>
                </div>
            </div>
        )
    }
    
    buildRoom(room, key) {
        // If user in this room
        if (room.roomName === this.state.currRoom.roomName) {
            return (    
                <List.Item key={key} onClick={this.joinRoom} active>{room.roomName}</List.Item>
            );
        } 
        
        // For other rooms

        let notificationDisplay = null;

        if (this.state.roomNotifications[room.roomName]) {
            notificationDisplay = 
                <Label size='mini' color='red' style={{textAlign: 'center', height: '11px', width: '15px', float: 'right'}} >
                </Label>;
        }
        if (!notificationDisplay) {
            return (
                <List.Item key={key} onClick={this.joinRoom} as='a'>{room.roomName}</List.Item>
            );
        } else {
            return (
                <List.Item key={key} onClick={this.joinRoom} style={{fontWeight: 'bold'}} as='a'>{room.roomName} {notificationDisplay}</List.Item>
            );
        }
        
    } 
}

function buildMessage(msg, listKey) {
    const convertedDate = new Date(msg.time).toLocaleString();
    return (
        <li key={listKey}>
            <div className="user-image">
                <Image avatar src={msg.creatorAvatar} style={{maxHeight: '30px', maxWidth: '30px'}}/>
            </div>
            <div className="user-message">
                <div className="user-name-time">{msg.creatorName} <span>{convertedDate}</span></div>
                <div className="message-text">{msg.content}</div>
            </div>
        </li>
    )
        
}

// TODO build onClick for messaging
function buildActiveUser(userInfo, listKey) {
    let additionalDetails = (
        <div>
            Name: {userInfo.name}<br />
            Email: {userInfo.email}<br />
            <Button size="mini" color='green' content='Message' />
        </div>
    )
    return (
        <Popup 
            key={listKey}
            trigger={
                <List.Item key={listKey}>     
                    <Image avatar src={userInfo.avatar} />
                    <List.Content>
                        <List.Header>{userInfo.givenName}</List.Header>
                    </List.Content>
                </List.Item>
            
            }
            content={additionalDetails}
            on='click'
            position='top right'
        />
    );

    
}




export default Namespace;
