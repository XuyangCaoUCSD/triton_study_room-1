import React, {Component } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
// import socket from './utilities/socketConnection';
import API from '../utilities/API';
import ChatGroupIcon from '../ChatGroupIcon';

class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      chat_groups: {}
    }
  }

  componentDidMount() {
    // Retrieve namespacea information
    API({
      method: 'get',
      url: "/api/dashboard",
      withCredentials: true
    }).then((res) => {
        console.log('Get on dashboard route, Server responded with:');
        console.log(res);

        let data = res.data;

        this.setState({chat_groups: data.nsData});

    }).catch((err) => {
        console.log("Error while getting dashboard route, logging error: \n" + err);
        // Either use toString or ==
        if (err.response.status.toString() === "401") {
            console.log("UNAUTHORIZED ERROR 401 received");
            console.log('err.response is: \n');
            console.log(err.response);
        }

    });
  }

  render() {
    console.log(this.props);
    let chat_group_icons = [];
    const data = this.state.chat_groups;
    // grab each group and its value which is endpoint
    // Object.entries returns an array of key value pairs
    Object.entries(data).forEach(([key, value]) => {
      // Push chat group icon component onto array
      chat_group_icons.push(<ChatGroupIcon key={key} data={value} />);
    });
    return (
        <div>
            <h2>Dashboard</h2>
            {chat_group_icons}
        </div>
    );
  }
}

export default Dashboard;


