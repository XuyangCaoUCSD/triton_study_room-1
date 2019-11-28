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
import { Segment, Form, TextArea, Message, List, Image, Header, Icon, Popup, Modal, Button, Label, Menu } from 'semantic-ui-react';
import Loading from "../Loading";
import UploadFilesTest from "./UploadFilesTest";
import ChatGroupIcon from '../ChatGroupIcon';

class Namespace extends Component {
    constructor(props) {
        super(props);

        // NOTE IF CHANGE, ALSO CHANGE IN COMPONENTDIDMOUNT
        this.state = {
            inputMessageValue: '',
            endpoint: "/" + this.props.match.params.name,
            namespaceNameParam: this.props.match.params.name,
            roomNotifications: {},
            activeUsers: {},
            namespaceNotifications: {},
            peopleMap: {},
            fileUploadWindowOpen: false
        };

        this.parentSocket = this.props.socket;

        this.namespaceHTML = this.namespaceHTML.bind(this);

        this.handleInputChange = this.handleInputChange.bind(this);
        this.componentCleanup = this.componentCleanup.bind(this);
        this.buildRoom = this.buildRoom.bind(this);
        this.buildMessage = this.buildMessage.bind(this);
        this.activeUserClickHandler = this.activeUserClickHandler.bind(this);
        this.buildActiveUser = this.buildActiveUser.bind(this);
        this.getGroupsAPICall = this.getGroupsAPICall.bind(this);
        this.getNamespaceDetailsAPICall = this.getNamespaceDetailsAPICall.bind(this);
        this.sendFileMessage = this.sendFileMessage.bind(this);
        this.handleFileUploadWindowOpen = this.handleFileUploadWindowOpen.bind(this);
        this.closeFileUploadWindow = this.closeFileUploadWindow.bind(this);

        // Don't actually need to bind this to arrow functions
        this.messageInputHandler = this.messageInputHandler.bind(this);
        this.joinRoom = this.joinRoom.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
        // For cleaning up when refreshing
        window.addEventListener('beforeunload', this.componentCleanup);

        if (this.parentSocket) {
            console.log('ADDING MESSAGE NOTIFICATION CB');
            // Add listener for ns events
            this.parentSocket.on('messageNotification', this.onParentSocketMessageNotificationCB);
        }

        // Retrieve particular namespace information
        this.getNamespaceDetailsAPICall(this.state.endpoint);

        // Retrieve user namespaces information
        this.getGroupsAPICall();
    }
    
    // IMPORTANT: Need to accept endpoint parameter instead of using this.state.endpoint as 
    // when route param changes this.setState does not get executed immediately (refer to componentDidUpdate)
    getNamespaceDetailsAPICall(endpoint) {
        API({
            method: 'get',
            url: `/api/namespace${endpoint}`,
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
            let userEmail = data.userEmail;

            let peopleMap = {};
            
            // Hash email to person info
            data.currNs.peopleDetails.forEach((personInfo) => {
                peopleMap[personInfo.email] = personInfo
            });

            let namespaceEndpointsMap = {}; // keeps track of what chat groups the user has for faster check

            chatGroups.forEach((namespaceInfo) => {
                namespaceEndpointsMap[namespaceInfo.endpoint] = true;
            })
            
            this.setState({
                rooms: currNs.rooms,
                currRoom: currRoom,  // Joins first room by default
                groupName: currNs.groupName,
                roomNotifications,
                chatGroups,
                userEmail,
                currNs,
                namespaceEndpointsMap,
                peopleMap
            });

            if (this.socket != null) {
                console.log('disconnecting before reconnecting');
                this.socket.removeAllListeners('userMessage');
                this.socket.disconnect();
            }
            
            // this.socket = io.connect(`http://localhost:8181/namespace${endpoint}`); 
            // Need full path for now to avoid warning
            this.socket = io.connect(`http://localhost:8181/namespace${endpoint}`);

            console.log('just called connect');
            console.log(this.socket);

            // Only add listeners once
            this.socket.on('connect', this.onSocketConnectCB);
            this.socket.on('userMessage', this.onSocketMessageCB);
            this.socket.on('changeRoom', this.onSocketChangeRoomCB);
            this.socket.on('updateActiveUsers', this.onSocketUpdateActiveUsersCB);
            this.socket.on('roomNotification', this.onSocketRoomNotificationCB);

            console.log(`client socket connecting to /namespace${endpoint}`);

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

    getGroupsAPICall() {
        API({
            method: 'get',
            url: "/api/dashboard",
            withCredentials: true
        }).then((res) => {
            console.log('Get on dashboard route, Server responded with:');
            console.log(res);

            let data = res.data;
            if (!data.success) {
                console.log('Failed API call');
                return;
            }

            if (this._isMounted) {
                console.log('Setting new chat groups and notificaitons');
                this.setState({
                    chatGroups: data.nsData,
                    namespaceNotifications: data.namespaceNotifications
                });
            }

        }).catch((err) => {
            console.log("Error while getting dashboard route, logging error: \n" + err);

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

        if (this.parentSocket) {
            console.log(this.parentSocket);
            this.parentSocket.removeListener('messageNotification', this.onParentSocketMessageNotificationCB);
        }
        
    }

    componentWillUnmount() {
        console.log('Calling will unmount');
        this.componentCleanup();
        
        window.removeEventListener('beforeunload', this.componentCleanup);
        this._isMounted = false;
    }
    
    componentDidUpdate(prevProps) {
        
        // Only reset route stuff if endpoint ("/" + name parameter) is not same as previous
        if (prevProps == undefined || prevProps.match.params.name === this.props.match.params.name) {
            this.scrollToBottom();
        } else {
            console.log('Changing namespace to ' + this.props.match.params.name + " (prev was " + prevProps.match.params.name);
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }

            // IMPORTANT DO EXACTLY AS HOWEVER STATE WAS INITIALISED IN CONSTRUCTOR 
            this.setState({
                inputMessageValue: '',
                endpoint: "/" + this.props.match.params.name,
                namespaceNameParam: this.props.match.params.name,
                roomNotifications: {},
                activeUsers: {},
                namespaceNotifications: {},
                fileUploadWindowOpen: false
                // rooms: null
            });

            let endpoint = "/" + this.props.match.params.name;
            
            // Retrieve particular namespace information, passing in new endpoint as should not rely on this.state in call
            this.getNamespaceDetailsAPICall(endpoint);

            // Retrieve user namespaces information
            this.getGroupsAPICall();
            
        }
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
        // Only submit if user is clickin enter (not shift enter)
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const message = this.state.inputMessageValue; // Get value from state as input used is controlled component
            
            console.log('Message is');
            console.log(message);

            // Do nothing if empty message
            if (message == "") {
                console.log('Empty message');
                return;
            }

            this.setState({
                inputMessageValue: '' // clear text area
            });

            this.scrollToBottom(true);
            
            console.log('message input form is ');
            console.log(this.messageInputForm);

            // Do this.socket emit
            if (this.socket != null) {
                this.socket.emit('userMessage', message);
            } else {
                console.log('ERROR: No socket to emit message');
            }

        } else if (e.key === "Tab") {
            e.preventDefault();
            let currInputMessage = this.state.inputMessageValue;
            currInputMessage += "\t";
            this.setState({
                inputMessageValue: currInputMessage
            });
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

    onSocketUpdateActiveUsersCB = (newActiveUsers) => {
        // NOTE NOT DOING this.setsate({activeUsers: newActiveUsers}) as people joining will change order of existing list
        let activeUsers = {...this.state.activeUsers};

        // Remove non-active users
        Object.keys(activeUsers).forEach((email) => {
            if (!newActiveUsers[email]) {
                delete activeUsers[email];
            }
        });

        // Loop through new active emails, and add to new activeUsers object if not exist
        Object.keys(newActiveUsers).forEach((email) => {
            if (!this.state.activeUsers[email]) {
                activeUsers[email] = newActiveUsers[email];
            }
        });

        this.setState({
            activeUsers: activeUsers
        });
        console.log('Active Users are:');
        console.log(activeUsers);
    }

    onSocketRoomNotificationCB = (roomName) => {
        console.log('Received roomNotification for room ' + roomName);
        this.updateRoomNotifications(roomName, true);
    }
    // ---------------- End of socket callbacks --------------------

    //----------------------- Parent socket CBs ------------
    // Real-time notifications for online users but not in namespace
    onParentSocketMessageNotificationCB = (namespaceEndpoint) => {
        // If message from new person, get user namespaces info again to get new chat group
        if (this.state.namespaceEndpointsMap && !this.state.namespaceEndpointsMap[namespaceEndpoint]) {
            console.log('Message from new user, getting groups again!');
            this.getGroupsAPICall();

        } else {
            let namespaceNotifications = {...this.state.namespaceNotifications};
            console.log(`Setting namespaceNotifications for ${namespaceEndpoint} to true`);
            namespaceNotifications[namespaceEndpoint] = true;
            this.setState({
                namespaceNotifications,
            });
        } 

        this.props.removeNavBarNotifications(); // No need to display notif in navbar when at groups page
    }

    //----------------------- End of parent socket CBs-------

    // Handles click on namespace
    iconsClickHandler = (data) => {
        console.log('data in icons click handler is');
        console.log(data);

        console.log(`pushing /namespace${data.endpoint} to history`);
        // Temp, make it like dashboard where we use redirect
        this.props.history.push(`/namespace${data.endpoint}`);
        // window.location.reload(); // Force reload to force rerender as using same Namespace class instance
    }

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

    sendFileMessage(fileName, fileUrl) {
        let message = fileName + "\n" + fileUrl;
        this.socket.emit('userMessage', message);

        // Close Upload window after a delay
        setTimeout(() => {
            this.closeFileUploadWindow();
        }, 700);
    }
    
    handleFileUploadWindowOpen() {
        console.log('Opening upload window');
        this.setState({
            fileUploadWindowOpen: true
        });
    }

    closeFileUploadWindow() {
        console.log('Closing upload window');
        if (this._isMounted) {
            this.setState({
                fileUploadWindowOpen: false
            });
        } 
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
            Object.entries(chatGroupsInfo).forEach(([key, nsInfo]) => {
                // Push chat group icon component onto array
                chatGroupIcons.push(<ChatGroupIcon key={key} data={nsInfo} currUserEmail={this.state.userEmail} hasNotifications={this.state.namespaceNotifications[nsInfo.endpoint]} onClickHandler={() => this.iconsClickHandler(nsInfo)} />);
            });  
            
            let chatHistory = [];
            // chatHistory.push(buildMessage("Hello There"));
            // chatHistory.push(buildMessage("Lorem Ipsum"));
            // chatHistory.push(buildMessage("Pig latin"));
            if (this.state.currRoom && this.state.currRoom.chatHistory != null) {
                let key = 0;
                this.state.currRoom.chatHistory.messages.forEach((message) => {
                    chatHistory.push(this.buildMessage(message, key));
                    key += 1
                })
            }

            let activeUsersList = [];
            if (this.state.activeUsers) {
                let activeUsersInfo = Object.values(this.state.activeUsers);
                let key = 0;
                activeUsersInfo.forEach((userInfo) => {
                    activeUsersList.push(this.buildActiveUser(userInfo, key));
                    key += 1
                });
            }

            let groupDisplayName;
            if (this.state.currNs.privateChat) {
                // Find the details of other user
                let otherUser = this.state.currNs.peopleDetails.find((info) => {
                    return this.state.userEmail !== info.email;
                });
                groupDisplayName = otherUser.name;
            } else {
                groupDisplayName = this.state.groupName;
            }

            return (
                // TODO make outer one screen (height: "100vh", width: "100vw")
                // TODO appropriate inner divs 100% width and height instead of having to nest

                <div className="ui container" style={{height: "75vh", width: "100vw"}}>
                    <h2 style={{textAlign: 'center'}}>{groupDisplayName}</h2>
                    {this.namespaceHTML(chatGroupIcons, rooms, chatHistory, activeUsersList)}
                </div>
            );
           
        } else {
            return <Loading type="spinningBubbles" color="#0B6623" />;
        }
        
    }

    namespaceHTML(chatGroups, rooms, messages, activeUsersList) {
        // Default stuff are for private chat, overwrite if not
        let roomsDiv = null;
        let activeUsersDiv = null;
        let messageColumnDivClassName = "fourteen wide column";
        let roomNameArea = 
            <span>
                <Header size='tiny' as='h5' >
                    <Icon name='user' />
                    <Header.Content>Direct Message</Header.Content>
                </Header>
            </span>;

        if (!this.state.currNs.privateChat) {
            roomsDiv = 
                <div className="two wide column rooms">
                    <h3>Channels <Icon name='chat'></Icon></h3>
                    <List divided size='large' link>
                        {rooms}
                    </List>
                </div>;
            
            activeUsersDiv = 
                <div className="two wide column" style={{height: "100%", width: '100%'}}>
                    <Header as='h4' textAlign='left'>
                        <Icon name='users' circular />
                        <Header.Content>Online In {this.state.groupName}: {activeUsersList.length}</Header.Content>
                    </Header>
                    <List selection animated verticalAlign='middle'>
                        {activeUsersList}
                    </List>
                </div>;
            
            messageColumnDivClassName = "ten wide column";
            // roomNameArea = <span className="curr-room-text"> {this.state.currRoom.roomName} </span>;
            roomNameArea = 
                <span>
                    <Header size='tiny' as='h5' >
                        <Icon name='users' />
                        <Header.Content>{this.state.currRoom.roomName}</Header.Content>
                    </Header>
                </span>
        }
        
        let fileUpload = 
            <Modal
                open={this.state.fileUploadWindowOpen}
                closeIcon
                onClose={this.closeFileUploadWindow}
                size='small' 
                trigger={
                    <Button size='tiny' onClick={this.handleFileUploadWindowOpen} style={{right: "3.5%", bottom: "0%", zIndex: 10, position: 'absolute'}} icon='paperclip' />
                }
            >
                <Modal.Header>Upload Files</Modal.Header>
                <Modal.Content >
                    <UploadFilesTest sendFileMessage={this.sendFileMessage} endpoint={this.state.currNs.endpoint} groupName={this.state.currNs.groupName} />
                </Modal.Content>
            </Modal>;


        return (
            <div className="ui grid" style={{height: "100%", width: '100%'}}>
                <div className="two wide column namespaces">
                    <Menu compact icon='labeled' vertical>
                        {chatGroups}
                    </Menu>
                </div>
                {roomsDiv}
                <div className={messageColumnDivClassName} style={{height: "100%", width: '100%'}}>
                    <div className="row">
                        <div className="three wide column">
                            {roomNameArea}
                        </div>
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
                        
                        <Form ref={(el) => { this.messageInputForm = el; }} style={{width: '100%'}}>
                            <TextArea style={{whiteSpace: 'pre-wrap'}} value={this.state.inputMessageValue} name="message" onChange={this.handleInputChange} style={{resize: 'none'}} onKeyDown={this.messageInputHandler} maxLength="40000" placeholder="Enter your message" rows="2" />
                        </Form>
                    </div>
                    {fileUpload}
                </div>
                {activeUsersDiv}
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

    
    // Should take them to direct message page
    activeUserClickHandler(e) {
        let selectedEmail = e.currentTarget.getAttribute('email'); // Note: currentTarget not target to ensure outermost div
        console.log(selectedEmail);
        
        // If emails are same do nothing (don't redirect) (don't allow self-messaging for now)
        if (this.state.userEmail === selectedEmail) {
            console.log('Self user clicked, doing nothing');
            return;
        }

        let data = {
            privateChat: true,
            secondUserEmail: selectedEmail
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

    // TODO build onClick for messaging
    // buildActiveUser(userInfo, listKey) {
    //     let additionalDetails = (
    //         <div>
    //             Name: {userInfo.name}<br />
    //             Email: {userInfo.email}<br />
    //             {/* <Button size="mini" color='green' content='Message' /> */}
    //         </div>
    //     )
    //     return (
    //         <Popup
    //             key={listKey}
    //             trigger={
    //                     <List.Item email={userInfo.email} user-name={userInfo.name} onClick={this.activeUserClickHandler} key={listKey}>     
    //                         <Image avatar src={userInfo.avatar} />
    //                         <List.Content>
    //                             <List.Header>{userInfo.givenName}</List.Header>
    //                         </List.Content>
    //                     </List.Item>
    //             }
    //             content={additionalDetails}
    //             position='top right'
    //             on='hover'
    //         />
            
    //     );
        
    // }

    buildActiveUser(userInfo, listKey) {
        let additionalDetails = (
            <div>
                <h4>
                    Name: {userInfo.name}<br />
                    Email: {userInfo.email}
                </h4>
                <br /><br /><br /><br /><br /><br /><br /><br /><br />
               
                <div>
                    {this.state.userEmail != userInfo.email && <Button email={userInfo.email} user-name={userInfo.name} size="mini" color='green' onClick={this.activeUserClickHandler}  content='Message' />}     
                </div>         
            </div>
        )
        return (
            <Modal
                closeIcon
                size='small' 
                key={listKey} 
                trigger={
                    <List.Item email={userInfo.email} user-name={userInfo.name} key={listKey}>     
                        <Image avatar src={userInfo.avatar} />
                        <List.Content>
                            <List.Header>{userInfo.givenName}</List.Header>
                        </List.Content>
                    </List.Item>
                }
            >
                <Modal.Header>{userInfo.name}</Modal.Header>
                <Modal.Content image>
                    <Image wrapped size='medium' src={userInfo.avatar} />
                    <Modal.Description>
                        {additionalDetails}
                    </Modal.Description>
                </Modal.Content>
            </Modal>
            
        );
        
    }

    
    buildMessage(msg, listKey) {
        const convertedDate = new Date(msg.time).toLocaleString();
        return (
            <li key={listKey}>
                <Message style={{whiteSpace: 'pre-wrap'}}>
                    <div className="user-image">
                        {/* <Image avatar src={msg.creatorAvatar} style={{maxHeight: '30px', maxWidth: '30px'}}/> */}
                        <Image avatar src={this.state.peopleMap ? this.state.peopleMap[msg.creatorEmail].avatar : null } style={{maxHeight: '30px', maxWidth: '30px'}}/>
                    </div>
                    <div className="user-message">
                        <div className="user-name-time">{msg.creatorName} <span>{convertedDate}</span></div>
                        {msg.content}
                    </div>
                </Message>
                
            </li>
        )
            
    }
}




export default Namespace;
