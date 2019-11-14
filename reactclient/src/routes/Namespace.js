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
// import socket from '../utilities/socketConnection';
import { Segment, Form, TextArea } from 'semantic-ui-react';
import Loading from "../Loading";
import ChatGroupIcon from '../ChatGroupIcon';

class Namespace extends Component {
    constructor(props) {
        super(props);
        this.state = {
            inputMessageValue: '',
            socketConnected: false,
            endpoint: this.props.match.params.name
        };
        
        console.log('endpoint is ' + this.props.match.params.name);
        

        this.namespaceHTML = this.namespaceHTML.bind(this);

        this.handleInputChange = this.handleInputChange.bind(this);
        this.componentCleanup = this.componentCleanup.bind(this);
        this.messageInputHandler = this.messageInputHandler.bind(this);
    }

    componentDidMount() {
        // For cleaning up when refreshing
        window.addEventListener('beforeunload', this.componentCleanup);

        // TODO add is mounted checks to prevent setting state when unmounted
        // Retrieve particular namespace information
        API({
            method: 'get',
            // url: `/api/namespace/${this.props.namespace}`,
            url: `/api/namespace/cse110`, // TODO hardcoded for now
            withCredentials: true
        }).then((res) => {
            console.log('Get on Namespace route, Server responded with:');
            console.log(res);

            let data = res.data;
            console.log(data);
            
            let chatGroups = data.nsData;

            let cse110Namespace = data.currNs;
            
            this.setState({
                endpoint: cse110Namespace.endpoint,  // TODO should not be cse110 hardcoded
                rooms: cse110Namespace.rooms,
                currRoom: cse110Namespace.rooms[0],  // Joins first room by default
                nsTitle: cse110Namespace.nsTitle,
                chatGroups
            });


            // this.socket = io.connect(`/namespace${cse110Namespace.endpoint}`, {transports: ['websocket']});

            if (this.socket != null) {
                console.log('disconnecting before reconnecting');
                this.socket.removeAllListeners('userMessage');
                this.socket.disconnect();
            }
            
            // this.socket = io.connect(`http://localhost:8181/namespace${this.state.endpoint}`); 
            // Need full path for now to avoid warning
            this.socket = io.connect(`http://localhost:8181/namespace/cse110`);

            console.log('just called connect');
            console.log(this.socket);

            // Only add listeners once
            this.socket.on('connect', this.onSocketConnectCB);
            this.socket.on('userMessage', this.onSocketMessageCB);

            console.log(`client socket connecting to /namespace${this.state.endpoint}`);

            this.scrollToBottom();

            // setTimeout(() => { 
            //     if (this.socket != null) {
            //         this.socket.disconnect();
            //         console.log(this.socket);
            //         this.socket.removeAllListeners();
            //         this.socket = null;
            //     }
                
            // }, 5000);

        }).catch((err) => {
            console.log("Error while getting Namespace route, logging error: \n" + err);
            // Either use toString or ==
            if (err.response && err.response.status && err.response.status.toString() === "401") {
                console.log("UNAUTHORIZED ERROR 401 received");
                console.log('err.response is: \n');
                console.log(err.response);
            }

        });
    }
    
    componentCleanup() {
        console.log('Cleanup called');
        if (this.socket != null) {
            console.log('Disconnecting socket');
            this.socket.removeAllListeners('connect');
            this.socket.removeAllListeners('userMessage');
            this.socket.removeAllListeners('connecting');
            this.socket.on('disconnect', () => {
                console.log('Confirmed disconnect on client side');
            });

            this.socket.disconnect();

            this.socket.removeAllListeners('disconnect');
            this.socket = null;
        }
    }

    componentWillUnmount() {
        console.log('Calling will unmount');
        this.componentCleanup();
        window.removeEventListener('beforeunload', this.componentCleanup);
    }
    
    componentDidUpdate() {
        this.scrollToBottom();
    }

    // Scroll to last message
    scrollToBottom = () => {
        // "Auto" to get there immediately. TODO when to use auto, when to use smooth, when to not scroll.
        if (this.messagesEnd) {
            this.messagesEnd.scrollIntoView({ behavior: "smooth" });
        }
    }

    onSocketConnectCB = () => {
        console.log('connected!');
        this.setState({
            socketConnected: true
        });
    }

    onSocketMessageCB = (msg) => {
        console.log(this.state.currRoom);
        let chatHistory = [...this.state.currRoom.chatHistory, msg]; // assume immutable, make copy

        let newCurrRoom = {...this.state.currRoom};
        newCurrRoom.chatHistory = chatHistory;
        
        this.setState({
            currRoom: newCurrRoom
        });
    }

    iconsClickHandler = (data) => {
        // console.log('data in icons click handler is');
        // console.log(data);
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

    messageInputHandler = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const message = this.state.inputMessageValue; // Get value from state as input used is controlled component
            this.setState({
                inputMessageValue: '' // clear text area
            });
            console.log('message is ');
            console.log(message);

            // Do this.socket emit
            if (this.socket != null) {
                this.socket.emit('userMessage', message);
            } else {
                console.log('No socket to emit message');
            }
        } 
    }

    render() {
        if (this.state.rooms != null) {
            // TODO, make it so that room and namespaces in this part shouldn't have to reload every keystroke

            // These info should only be loaded once when component mounts.
            // Only messages will be updated after that
            console.log(this.props);

            let rooms = [];
            const roomsInfo = this.state.rooms;
            // grab each group and its value which is endpoint
            // Object.entries returns an array of key value pairs
            Object.entries(roomsInfo).forEach(([key, value]) => {
                // Push namespace group icon component onto array
                rooms.push(<li key={key} data={value}>{value.roomName}</li>);
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
            this.state.currRoom.chatHistory.forEach((message) => {
                chatHistory.push(buildMessage(message));
            })

            return (
                // TODO make outer one screen (height: "100vh", width: "100vw")
                // TODO appropriate inner divs 100% width and height instead of having to nest

                <div className="ui container" style={{height: "100vh", width: "100vw",}}>
                    <h2>CSE 110</h2>
                    {this.namespaceHTML(chatGroupIcons, rooms, chatHistory, this.messageInputHandler)}
                </div>
            );
           
        } else {
            return (
                <Loading type="spinningBubbles" color="#0B6623" />
            )
        }
        
    }

    handleInputChange(e) {
        this.setState({
            inputMessageValue: e.target.value
        })
    }

    namespaceHTML(chatGroups, rooms, messages, messageInputHandler) {
        return (
            <div className="ui grid" style={{height: "100%", width: '100%'}}>
                <div className="two wide column namespaces">
                    {chatGroups}
                </div>
                <div className="two wide column rooms">
                    <h3>Rooms <i aria-hidden="true" className="lock open small icon"></i></h3>
                    <ul className="room-list" style={{listStyleType: "none", padding: 0}}>
                        {rooms}
                    </ul>
                </div>
                <div className="eleven wide column" style={{height: "100%", width: '100%'}}>
                    <div className="room-header row col-6">
                        <div className="three wide column"><span className="curr-room-text">Current Room</span> <span className="curr-room-num-users">Users <i aria-hidden="true" className="users disabled large icon"></i></span></div>
                        {/* <div className="three wide column ui search pull-right">
                            <input type="text" id="search-box" placeholder="Search" />
                        </div> */}
                    </div> 
                    <Segment color="teal" style={{overflowY: 'scroll', height: '100%', width: '100%', wordWrap: 'break-word'}}>
                        <ul id="messages" className="twelve wide column" style={{listStyleType: "none", padding: 0}}>
                            {messages}
                            {/* Dummy div below to use to scroll to bottom */}
                            <div style={{ float:"left", clear: "both" }}
                                ref={(el) => { this.messagesEnd = el; }}>
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
            </div>
        )
    }
    
}

function buildMessage(messageText) {
    // const convertedDate = new Date(msg.time).toLocaleString();

    // Hardcoded for now
    let msg = {
        username: 'Buddy',
        text: messageText,
        avatar: 'https://cdn5.vectorstock.com/i/1000x1000/51/99/icon-of-user-avatar-for-web-site-or-mobile-app-vector-3125199.jpg',
        time: 10,  
    }

    return (
        <li>
            <div className="user-image">
                <img src={msg.avatar} style={{maxHeight: '30px'}}/>
            </div>
            <div className="user-message">
                <div className="user-name-time">{msg.username} <span>{msg.time}</span></div>
                <div className="message-text">{msg.text}</div>
            </div>
        </li>
    )
        
}

export default Namespace;
