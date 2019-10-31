import React, { Component } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink
} from "react-router-dom";
import './App.css';
// import socket from './utilities/socketConnection';
import Dashboard from './routes/Dashboard';
import Home from './routes/Home';
import About from './routes/About';
import Login from './routes/Login';
import Register from './routes/Register';
import { ProtectedRoute } from './auth/ProtectedRoute';
import 'semantic-ui-css/semantic.min.css';

class App extends Component {
    constructor() {
        super();
        this.state = {}
    }

    componentDidMount() {
        // socket.on('data', (data) => {
        //   // inside this callback , we just got some new data!
        //   // let's update state so we can 
        //   // re-render App --> CPU/Mem/Info
        //   // We need to make copy of current state so we can mutate it
        //   const currentState = ({...this.state.performanceData});
        //   // const currentState = Object.assign(this.state.performanceData, {});
        //   // current state is an object! Not an array!
        //   // The reason for this is so we can use the machine's MacA as its property
        //   currentState[data.macA] = data;
        //   this.setState({
        //     performanceData: currentState
        //   });
        // });
    }


    render() {
        return (
            <Router>
                <div>
                    <ul>
                        <li>
                            <NavLink to="/" activeClassName="activeLink">Home</NavLink>
                        </li>
                        <li>
                            <NavLink to="/about">About</NavLink>
                        </li>
                        <li>
                            <NavLink to="/login">Login</NavLink>
                        </li>
                        <li>
                            <NavLink to="/register">Sign Up</NavLink>
                        </li>
                        <li>
                            <NavLink to="/dashboard">Dashboard</NavLink>
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
                        <Route exact path="/login" component={Login} />
                        <Route exact path="/register" component={Register} />
                        <Route exact path="/about" component={About} />
                        <ProtectedRoute exact path="/dashboard" component={Dashboard} />
                        
                        <Route path="*" component={() => "404 NOT FOUND"} />
                    </Switch>
                </div>
            </Router>
        );
    }
}

export default App;