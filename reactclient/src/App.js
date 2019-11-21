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
import auth from "./auth/auth";
import { ProtectedRoute } from './auth/ProtectedRoute';
import 'semantic-ui-css/semantic.min.css';
import { Menu, Icon, Sidebar } from 'semantic-ui-react';

class App extends Component {
    constructor() {
        super();
        this.state = {
            isLoggedIn: null,
            sidebarOpen: false
        }

        this._isMounted = false;
        
        this.authMemoHandler = this.authMemoHandler.bind(this);
        this.isAuthenticated = this.isAuthenticated.bind(this);

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

            } else {
                console.log('Setting login state to false');
                this.setState({
                    isLoggedIn: false,
                    waitingForAPI: false
                });
            }
        } 
    }

    render() {
        console.log('Is logged in is');
        console.log(this.state.isLoggedIn);
        if (!this.state.waitingForAPI) {
            return (
                <Router>
                    {/* <Sidebar
                        as={Menu}
                        animation='overlay'
                        icon='labeled'
                        inverted
                        vertical
                        visible={true}
                        width='thin'
                    >   
                        <NavLink as='a' to="/">
                            <Menu.Item link>
                                <Icon name='home' />      
                                Home
                            </Menu.Item>
                        </NavLink>
                        <NavLink as='a' to="/">
                            <Menu.Item link>
                                <Icon name='home' />      
                                Dashboard
                            </Menu.Item>
                        </NavLink>
                    </Sidebar> */}

                    <div>
                        <ul>
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
    
                        <hr />
    
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
                            <ProtectedRoute authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} exact path="/dashboard" component={Dashboard} />
                            <ProtectedRoute authMemoHandler={this.authMemoHandler} isLoggedIn={this.state.isLoggedIn} exact path="/namespace/:name" component={Namespace} />
                            
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