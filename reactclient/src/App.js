import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink,

} from "react-router-dom";
import './App.css';
// import socket from './utilities/socketConnection';
import Loading from "./Loading";
import Dashboard from './routes/Dashboard';
import Home from './routes/Home';
import About from './routes/About';
import Login from './routes/Login';
import Logout from './routes/Logout';
import Register from './routes/Register';
import Namespace from './routes/Namespace';
import UserSearch from './routes/UserSearch';
import NotiCenter from "./routes/NotiCenter";
import Calendar from './routes/Calendar';
import Profile from './routes/Profile';
import NotificationCard from './routes/NotificationCard';
import Setting from './routes/Setting';
import MultiUserSelect from './routes/MultiUserSelect';
import auth from "./auth/auth";
import { ProtectedRoute } from './auth/ProtectedRoute';
import 'semantic-ui-css/semantic.min.css';
import { Menu, Icon, Sidebar, Button, Label, Sticky } from 'semantic-ui-react';
import io from 'socket.io-client';
import UserProfile from "./routes/UserProfile";

class App extends Component {
    constructor() {
        super();
        this.state = {
            isLoggedIn: null,
            sidebarOpen: false,
            hasMessages: false,
            socket: null,
        }

        this._isMounted = false;
        // this.state.socket = null;
        
        this.authMemoHandler = this.authMemoHandler.bind(this);
        this.isAuthenticated = this.isAuthenticated.bind(this);
        this.removeNavBarNotifications = this.removeNavBarNotifications.bind(this);
        this.onSetSidebarOpen = this.onSetSidebarOpen.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;

        // socket.on('data', (data) => {
        //   // inside this callback , we just got some new data!
        //   // let's update state so we can 
        //   // re-render App
        //   // We need to make copy of current state so we can mutate it
        //   const currentState = ({...this.state.data});
        //   // const currentState = Object.assign(this.state.data, {});
        //   // current state is an object! Not an array!
        //   this.setState({
        //     t_data: currentState
        //   });
        // });
    }

    componentWillUnmount() {
        // Avoid memory leak (setting state after component unmounted)
        this._isMounted = false;
    }

    authMemoHandler() {
        console.log('this is ');
        console.log(this);
        if (this._isMounted) {
            this.setState({
                waitingForAPI: true
            })
        }
        
        console.log('Auth memo handler executed');
        // Care, state variable will force rerender before redirect
        this.isAuthenticated();
    }

    onSetSidebarOpen(open) {
        this.setState({ sidebarOpen: open });
    }

    onMessagesClick() {
        this.onSetSidebarOpen(false);
        this.setState({
            hasMessages: false
        });
    }

    isAuthenticated = async () => {
        console.log('Checking auth');
        let result = await auth.isAuthenticated();
        
        // Only set state if component is still there (not unmounted) to avoid memory leak
        if (this._isMounted) {
            if (result === true) {
                console.log('Setting login state to true');
                this.setState({
                    isLoggedIn: true,
                    waitingForAPI: false
                });

                console.log('This.state.socket is :');
                console.log(this.state.socket);
                
                if (!this.state.socket || this.state.socket.disconnected) {
                    console.log('Connecting to main namespace');
                    this.state.socket = io.connect('http://localhost:8181'); // Connect to general (root) namespace once logged in
                    this.state.socket.on('connect', this.onSocketConnectCB);
                    this.state.socket.on('reconnect', this.onSocketReconnectCB);
                    this.state.socket.on('messageNotification', this.onSocketMessageNotificationCB);
                    console.log('this.state.socket is now: ');
                    console.log(this.state.socket);
                    
                    // Don't render components till socket connected
                    this.setState({
                        waitingForAPI: true
                    })

                    
                }
                

            } else {
                console.log('Setting login state to false');
                this.setState({
                    isLoggedIn: false,
                    waitingForAPI: false
                });

                if (this.state.socket != null && this.state.socket.connected) {
                    console.log('Manually disocnnecting socket');
                    this.state.socket.disconnect();
                }
            }
        } 
    }

    removeNavBarNotifications() {
        this.setState({
            hasMessages: false
        });
    }

    //-------------Socket CBs-----------------------
    onSocketConnectCB = () => {
        console.log('Socket connected to main namespace');
        console.log(this.state.socket);
        
        this.state.socket.emit('cacheOutsideUser', "");

        this.setState({
            waitingForAPI: false
        })
        
        this.forceUpdate(); // Force update to pass in socket to routes
    }

    onSocketReconnectCB = (attemptNumber) => {
        console.log('Socket REconnecting to main namespace');
        console.log(this.state.socket);

        this.forceUpdate(); // Force update to pass in socket to routes
    }

    // Real-time notifications for online users but not in namespace
    onSocketMessageNotificationCB = (namespaceEndpoint) => {
        console.log('Setting hasMessages to true in App.js');
        this.setState({
            hasMessages: true,
        });
    }


    //-------------End of socket CBs----------------

    render() {
        console.log('Is logged in is');
        console.log(this.state.isLoggedIn);
        if (!this.state.waitingForAPI) {
            // Notification for messages
            let messageNotification = null;
            if (this.state.hasMessages) {
                messageNotification = <Label circular color='red' empty></Label>;
            }
            return (
                <Router>
                    <Sidebar
                        as={Menu}
                        animation='overlay'
                        icon='labeled'
                        inverted
                        vertical
                        style={{zIndex: 500}} // Make zIndex higher than button to open sideBar
                        visible={this.state.sidebarOpen}
                        width='thin'
                        onHide={() => this.setState({sidebarOpen: false})}
                    >   
                        <Button basic inverted icon onClick={() => {this.onSetSidebarOpen(false)}}>
                            <Icon name='bars' />
                        </Button>
                        <NavLink as='a' to="/" onClick={() => {this.onSetSidebarOpen(false)}}>
                            <Menu.Item link>
                                <Icon name='home' />      
                                Home
                            </Menu.Item>
                        </NavLink>
                        <NavLink to="/login" onClick={() => {this.onSetSidebarOpen(false)}}>
                            <Menu.Item link>
                                <Icon name='sign-in' />      
                                Log In
                            </Menu.Item>
                        </NavLink>
                        <NavLink as='a' to="/logout" onClick={() => {this.onSetSidebarOpen(false)}}>
                            <Menu.Item link>
                                <Icon name='sign-out' />      
                                Logout
                            </Menu.Item>
                        </NavLink>
                        <NavLink as='a' to="/userSearch" onClick={() => {this.onSetSidebarOpen(false)}}>
                            <Menu.Item link>
                                <Icon name='search' />      
                                Find People
                            </Menu.Item>
                        </NavLink>
                        <NavLink as='a' to="/profile" onClick={() => {this.onSetSidebarOpen(false)}}>
                            <Menu.Item link>
                                <Icon name='user' />
                                Profile
                            </Menu.Item>
                        </NavLink>
                        <NavLink as='a' to="/notification" onClick={() => {this.onSetSidebarOpen(false)}}>
                            <Menu.Item link>
                                <Icon name='bell' />
                                Nottifcations
                            </Menu.Item>
                        </NavLink>
                        <NavLink as='a' to="/setting" onClick={() => {this.onSetSidebarOpen(false)}}>
                            <Menu.Item link>
                                <Icon name='setting' />
                                Settings
                            </Menu.Item>
                        </NavLink>
                        <NavLink as='a' to="/dashboard" onClick={() => {this.onSetSidebarOpen(false)}}>
                            <Menu.Item link>
                                <Icon name='calendar alternate outline' />      
                                Dashboard
                            </Menu.Item>
                        </NavLink>
                        <NavLink as='a' to="/calendar" onClick={() => {this.onSetSidebarOpen(false)}}>
                            <Menu.Item link>
                                <Icon name='calendar alternate outline' />      
                                Calendar
                            </Menu.Item>
                        </NavLink>
                        <NavLink as='a' to="/userprofile" onClick={() => {this.onSetSidebarOpen(false)}}>
                            <Menu.Item link>
                                <Icon name='calendar alternate outline' />
                                User Profile
                            </Menu.Item>
                        </NavLink>
                        {/* TODO CHANGE DASHBOARD ROUTE TO GROUPS ROUTE AND IMPLEMENT REAL DASHBOARD*/}
                        <NavLink as='a' to="/dashboard" onClick={() => {this.onMessagesClick()}}>
                            <Menu.Item link>
                                <Icon name='comments' /> 
                                {messageNotification}  
                                Groups/Messages
                            </Menu.Item>
                        </NavLink>   
                    </Sidebar>

                    {/* Button to open sidebar */}
                    {
                        !this.state.sidebarOpen && this.state.isLoggedIn &&
                        <Sticky>              
                            <Button color='blue' style={{top: 0, zIndex: 499, position: 'absolute'}} icon onClick={() => {this.onSetSidebarOpen(true)}}>
                                <Icon name='bars' />
                            </Button>
                        </Sticky>   
                    } 
                    

                    <div>
                        {/* <ul>
                            <li style={{display: "inline-block"}}>
                                <NavLink to="/">Home&emsp;</NavLink>
                            </li>
                            <li style={{display: "inline-block"}}>
                                <NavLink to="/login">Login&emsp;</NavLink>
                            </li>
                            <li style={{display: "inline-block"}}>
                                <NavLink to="/logout">Logout&emsp;</NavLink>
                            </li>
                            <li style={{display: "inline-block"}}>
                                <NavLink to="/dashboard">Dashboard&emsp;</NavLink>
                            </li>
                        </ul>
                        
                        <hr /> */}

                        <br />
                        <br />
    
                        {/*
                        A <Switch> looks through all its children <Route>
                        elements and renders the first one whose path
                        matches the current URL. Use a <Switch> any time
                        you have multiple routes, but you want only one
                        of them to render at a time
                        */}
                
                        <Switch>
                            <Route exact path="/" component={Home} />
                            <Route exact path="/logout" render={(props) => {return <Logout {...props} authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} />}} />
                            <Route exact path="/login/:error?" render={(props) => {return <Login {...props} authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} />}} />
                            <ProtectedRoute authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} removeNavBarNotifications={this.removeNavBarNotifications} socket={this.state.socket} exact path="/dashboard" component={Dashboard} />
                            <ProtectedRoute authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} removeNavBarNotifications={this.removeNavBarNotifications} socket={this.state.socket} exact path="/namespace/:name" component={Namespace} />
                            <ProtectedRoute authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} exact path="/userSearch" component={UserSearch} />
                            <ProtectedRoute authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} exact path="/calendar" component={Calendar} />
                            <ProtectedRoute authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} exact path="/userprofile" component={UserProfile} />
                            <ProtectedRoute authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} exact path="/profile" component={Profile} />
                            <ProtectedRoute authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} exact path="/notification" component={NotiCenter} />
                            <ProtectedRoute authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} exact path="/setting" component={Setting} />
                            <ProtectedRoute authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} exact path="/multiUserSelect" component={MultiUserSelect} />

                            <Route path="*" component={() => "404 NOT FOUND"} />
                        </Switch>
                    </div>
                </Router>
            );

        } else {
            return (
                <Loading type="spinningBubbles" color="#0B6623" />
            );
        }
        
    }
}

export default App;
