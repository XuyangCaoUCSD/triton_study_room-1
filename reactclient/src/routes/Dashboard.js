import React, {Component } from 'react';
import { Route, Redirect } from "react-router-dom";
import {withRouter} from 'react-router'
import { Segment, Form, TextArea, Message, Menu } from 'semantic-ui-react';
import API from '../utilities/API';
import ChatGroupIcon from '../ChatGroupIcon';

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chatGroups: {},
            namespaceNotifications: {} // Map namespace to whether it has notifications
        }

        this.props.removeNavBarNotifications(); // No need to display notif in navbar when at groups page
        console.log('Dashboard props are');
        console.log(this.props);

        this.getDashboardGroupsAPICall = this.getDashboardGroupsAPICall.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;

        window.addEventListener('beforeunload', this.componentCleanup);

        if (this.props.socket) {
            this.props.socket.on('messageNotification', this.onSocketMessageNotificationCB);
        }
        
        // Retrieve user namespaces
        this.getDashboardGroupsAPICall();
    }

    componentCleanup() {
        console.log('Cleanup called');
        if (this.props.socket) {
            this.props.socket.removeListener('messageNotification', this.onSocketMessageNotificationCB);
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    
        this.componentCleanup();
        window.removeEventListener('beforeunload', this.componentCleanup);
    }

    getDashboardGroupsAPICall() {
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

            let chatGroups = data.nsData;
            let namespaceEndpointsMap = {}; // keeps track of what chat groups the user has for faster check

            chatGroups.forEach((namespaceInfo) => {
                namespaceEndpointsMap[namespaceInfo.endpoint] = true;
            })

            if (this._isMounted) {
                this.setState({
                    chatGroups: chatGroups,
                    namespaceNotifications: data.namespaceNotifications,
                    namespaceEndpointsMap,
                    userEmail: data.userEmail
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

    //------------------Socket CBs (socket passed from App.js)----------------
    // Real-time notifications for online users but not in namespace
    onSocketMessageNotificationCB = (namespaceEndpoint) => {
        // If message from new person, get user namespaces info again to get new chat group
        if (this.state.namespaceEndpointsMap && !this.state.namespaceEndpointsMap[namespaceEndpoint]) {
            console.log('Message from new user, getting groups again!');
            this.getDashboardGroupsAPICall();

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
    //-----------------End of socket CBs--------------

    iconsClickHandler = (data) => {
        console.log('data in icons click handler is');
        console.log(data);
        // Remove notification (passed in by App.js) (not necessary really to set to false)
        console.log('Props are');
        console.log(this.props);
        // this.props.handleNamespaceNotifications(data.endpoint, false);
        this.props.history.push(`/namespace${data.endpoint}`);
        
        // // Get request to get info for current namespace
        // API({
        //     method: 'get',
        //     url: `/api/namespace${data.endpoint}`,
        //     withCredentials: true
      
        // })
        // .then((res) => {
        //     console.log(`/api/namespace${data.endpoint} API responded with`);
        //     console.log(res);
        //     // if (this._isMounted) {
        //     //     this.setState({
        //     //         redirectTo: `/namespace${data.endpoint}`
        //     //     });

        //     //     // this.props.history.push(`/namespace${data.endpoint}`);
                
        //     // }
        //     console.log('dashboard props are');
        //     console.log(this.props);
        //     this.props.history.push(`/namespace${data.endpoint}`);
            
        // })
        // .catch((err) => {
        //     console.log(err);
        //     console.log(`Err in getting /api/namespace${data.endpoint} info`);

        //     let statusCode = err.response.status.toString();
        //     if (statusCode === "401") {
        //         console.log("ERROR code 401 received - UNAUTHENTICATED");
        //         this.props.history.push("/login/error");
        //     } else if (statusCode === "403") { 
        //         console.log("ERROR code 403 received - UNAUTHORISED CREDENTIALS");
        //         if (this._isMounted) {
        //             this.setState({
        //                 unauthorised: true
        //             })
        //         }
        //     }
        // });
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

        console.log(this.props);
        let chat_group_icons = [];
        const chatGroups_info = this.state.chatGroups;
        // grab each group and its value which is endpoint
        // Object.entries returns an array of key value pairs
        Object.entries(chatGroups_info).forEach(([key, nsInfo]) => {
            // Push chat group icon component onto array
            chat_group_icons.push(
                <ChatGroupIcon 
                    key={key} data={nsInfo} 
                    hasNotifications={this.state.namespaceNotifications[nsInfo.endpoint]} 
                    onClickHandler={() => this.iconsClickHandler(nsInfo)} 
                    currUserEmail={this.state.userEmail}
                />
            );
        });

        return (
            <div>
                <h2>Groups and Messages</h2>
                <div style={{maxWidth: "180px"}}>
                    <Menu compact icon='labeled' vertical style={{maxWidth: "100%", maxHeight: "100%"}}>
                        {chat_group_icons}
                    </Menu>
                </div>  
            </div>
        );  
    }
}

export default withRouter(Dashboard);


