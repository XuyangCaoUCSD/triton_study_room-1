import React, {Component } from 'react';
import { Route, Redirect } from "react-router-dom";
import {withRouter} from 'react-router'
import { Segment, Form, TextArea, Message } from 'semantic-ui-react';
import API from '../utilities/API';
import ChatGroupIcon from '../ChatGroupIcon';

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chat_groups: {}
        }
    }

    componentDidMount() {
        this._isMounted = true;
        // Retrieve namespace information
        API({
            method: 'get',
            url: "/api/dashboard",
            withCredentials: true
        }).then((res) => {
            console.log('Get on dashboard route, Server responded with:');
            console.log(res);

            let data = res.data;
            if (this._isMounted) {
                this.setState({chat_groups: data.nsData});
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

    componentWillUnmount() {
        this._isMounted = false;
    }

    iconsClickHandler = (data) => {
        console.log('data in icons click handler is');
        console.log(data);
        // Get request to get info for current namespace
        API({
            method: 'get',
            url: `/api/namespace${data.endpoint}`,
            withCredentials: true
      
        })
        .then((res) => {
            console.log(`/api/namespace${data.endpoint} API responded with`);
            console.log(res);
            // if (this._isMounted) {
            //     this.setState({
            //         redirectTo: `/namespace${data.endpoint}`
            //     });

            //     // this.props.history.push(`/namespace${data.endpoint}`);
                
            // }
            console.log('dashboard props are');
            console.log(this.props);
            this.props.history.push(`/namespace${data.endpoint}`);
            
        })
        .catch((err) => {
            console.log(err);
            console.log(`Err in getting /api/namespace${data.endpoint} info`);

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
        const chat_groups_info = this.state.chat_groups;
        // grab each group and its value which is endpoint
        // Object.entries returns an array of key value pairs
        Object.entries(chat_groups_info).forEach(([key, value]) => {
            // Push chat group icon component onto array
            chat_group_icons.push(<ChatGroupIcon key={key} data={value} onClickHandler={() => this.iconsClickHandler(value)} />);
        });

        return (
            <div>
                <h2>Dashboard</h2>
                {chat_group_icons}
            </div>
        );  
    }
}

export default withRouter(Dashboard);


