import React, {Component } from 'react';
import { Route, Redirect } from "react-router-dom";
import {withRouter} from 'react-router'
import { Icon, Popup, Button, Message, Menu, Dropdown } from 'semantic-ui-react';
import API from '../utilities/API';
import ChatGroupIcon from '../ChatGroupIcon';

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chatGroups: {},
            namespaceNotifications: {}, // Map namespace to whether it has notifications
            editingGroups: false,
            publicNamspacesOptions: [
            ],
            selectedPublicNamespaceEndpoint: ""
        }

        this.props.removeNavBarNotifications(); // No need to display notif in navbar when at groups page
        console.log('Dashboard props are');
        console.log(this.props);

        this.getDashboardGroupsAPICall = this.getDashboardGroupsAPICall.bind(this);
        this.handleJoinNamespace = this.handleJoinNamespace.bind(this);
        this.getPublicNamespaces = this.getPublicNamespaces.bind(this);
        this.removeGroup = this.removeGroup.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;

        window.addEventListener('beforeunload', this.componentCleanup);

        if (this.props.socket) {
            this.props.socket.on('messageNotification', this.onSocketMessageNotificationCB);
        }
        
        // Retrieve user namespaces
        this.getDashboardGroupsAPICall();
        this.getPublicNamespaces();
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

    handlePublicNamespaceClick = (e) => {
        this.setState({
            selectedPublicNamespaceEndpoint: e.currentTarget.getAttribute('endpoint')
        })
    }

    handleJoinNamespace() {
        if (!this.state.selectedPublicNamespaceEndpoint) {
            console.log('Need to select something to join'); 
            return;
        }

        API({
            method: 'patch',
            url: `/api/namespace${this.state.selectedPublicNamespaceEndpoint}/add-user`,
            withCredentials: true
        }).then((res) => {
            let data = res.data;
            if (!data.success) {
                console.log('Failed API to add user to namespace');
            }

            if (this._isMounted) {
                this.setState({
                    selectedPublicNamespaceEndpoint: ""
                })
                this.getDashboardGroupsAPICall();
                this.getPublicNamespaces();
            }

        }).catch((err) => {
            console.log(err);
        });
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

            if (data.newUser) {
                console.log('NEW USER!!\n')
                setTimeout(() => {
                    this.props.history.push('/profile');
                }, 2000)
                
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

    getPublicNamespaces() {
        API({
            method: 'get',
            url: "/api/namespace",
            withCredentials: true
        }).then((res) => {
            console.log('Getting all public namespaces route, Server responded with:');
            console.log(res);

            let data = res.data;
            if (!data.success) {
                console.log('Failed API call');
                return;
            }
            
            let publicNamespaces = data.collectedNamespaces;

            let publicNamespacesOptions = publicNamespaces.map((nsInfo) => {
                return {
                    key: nsInfo.endpoint,
                    value: nsInfo.endpoint,
                    endpoint: nsInfo.endpoint,
                    image: nsInfo.img,
                    text: nsInfo.groupName,
                    onClick: this.handlePublicNamespaceClick
                }
            });

            if (this._isMounted) {
                this.setState({
                    publicNamespacesOptions
                });
            }

        }).catch((err) => {
            console.log("Error while getting dashboard route, logging error: \n" + err);
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
    }

    editClickHandler = (e) => {
        console.log('Editing groups');
        
        this.setState({
            editingGroups: !this.state.editingGroups
        });
    }

    // To be passed to ChatGroupIcon as props
    removeGroup(endpoint) {
        let currGroups = this.state.chatGroups;

        let foundIndex = -1;

        for (var i = 0; i < currGroups.length; i++) {
            if (currGroups[i].endpoint === endpoint) {
                foundIndex = currGroups;
                break;
            }
        }

        if (foundIndex === -1) {
            console.log('ERROR: COULD NOT FIND GROUP TO REMOVE ON FRONT END');
            return;
        }

        currGroups.splice(foundIndex, 1);

        this.setState({
            chatGroups: currGroups
        });

        this.getPublicNamespaces();
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
                    removeGroup={this.removeGroup}
                    editingGroups={this.state.editingGroups}
                    hasNotifications={this.state.namespaceNotifications[nsInfo.endpoint]} 
                    onClickHandler={() => this.iconsClickHandler(nsInfo)} 
                    currUserEmail={this.state.userEmail}
                />
            );
        });

        let editButtonPopupContent = this.state.editingGroups ? 'Cancel' : 'Leave a group';
        let editButtonIconName = this.state.editingGroups ? 'cancel' : 'edit';

        let joinNamespaceButton = <Button disabled onClick={this.handleJoinNamespace}>Join Group</Button>;

        if (this.state.selectedPublicNamespaceEndpoint) {
            joinNamespaceButton = <Button onClick={this.handleJoinNamespace}>Join Group</Button>;
        }


        return (
            <div className='ui grid' style={{height: "100%", width: '100%'}}>
                <div className="four wide column">
                    <h2 >
                        Groups and Messages &nbsp;
                        <Popup 
                            content={editButtonPopupContent}
                            trigger={
                            <Button onClick={this.editClickHandler} size='tiny' circular color='orange' icon>
                                <Icon name={editButtonIconName} />
                            </Button>} 
                        />
                    </h2>
                
                    <div style={{maxWidth: "180px"}}>
                        <Menu compact icon='labeled' vertical style={{maxWidth: "100%", maxHeight: "100%"}}>
                            {chat_group_icons}
                        </Menu>
                    </div> 
                </div>

                <div className='five wide column'>
                    <div className='row'>
                        <div className='five wide column'>
                            <br></br>
                            <h3>Find a class to join</h3>
                        </div>
                    </div>

                    <div className='row'>
                        <div className='three wide column'>
                            <Dropdown
                                placeholder='Select a class'
                                search
                                fluid
                                selection
                                options={this.state.publicNamespacesOptions}
                            /> 
                        </div>
                        <div className='two wide column' >
                            {joinNamespaceButton}
                        </div>
                    </div>
                </div>

                
                
            </div>
            
        );  
    }
}

export default withRouter(Dashboard);


