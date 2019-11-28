import PropTypes from "prop-types";
import _ from "lodash";
import React, { Component } from "react";
import { Search, Grid, Header, Segment, Label, Image } from "semantic-ui-react";
import API from '../utilities/API';
import NotificationCard from './NotificationCard';

var source = [];

const resultRenderer = ({ avatar, title, about_me, email, is_friend }) => [
  avatar && (
    <div key="image" className="image">
      {/* {createHTMLImage(image, { autoGenerateKey: false })} */}
      <Image avatar src={avatar}></Image>
    </div>
  ),
  <div key="content" className="content">
    {title && <div className="title">{title}</div>}
    {about_me && <div className="description">{about_me}</div>}
    <div className="description">{email}</div>
    <div className="description">{is_friend}</div>
  </div>

];

// resultRenderer.propTypes = {
//   title: PropTypes.string,
//   description: PropTypes.string,
// }

const initialState = {isLoading: false, results: [], value: ""};

export default class UserSearch extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            results: [], 
            value: ""
        };

    }

    componentDidMount() {
        this._isMounted = true;
        this.fetch_data();
        console.log(this.props.endpoint);
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    fetch_data() {
        // accordingly modify the backend url
        var backendUrl = "/api/userSearch";
        backendUrl = backendUrl + this.props.endpoint;
        console.log("the baseUrl is "+backendUrl);
        
        API({
            // assemble HTTP get request
            method: 'get',
            url: backendUrl,
            withCredentials: true
        }).then((response) => {
            // extract the data from the body of response
            console.log("data successfully retrieved from backend!");
            console.log(response.data);
            if(this._isMounted) {
                source = response.data;
            }

        }).catch((error) => {
            // otherwise some error occurs
            console.log("error when submitting: "+error);
        });
    }

    handleResultSelect = (e, { result }) => {
        // e.preventDefault();
        this.setState({ value: result.title });
        if(this.props.goal === "add_friend") {
            this.addFriend(result);
        }
        else if(this.props.goal === "multi_select") {
            console.log(result.title);
            this.props.action(result);
        }
        
    };

    // After discussion, this should be called somewhere else (like a user profile view page)
    addFriend(result) {

        if (result.is_friend === "A friend of yours") {
            return;
        }
        else if(result.is_friend === "Yourself") {
            return;
        }
        // assemble HTTP post request
        // put the updated value (with user id) into the request body in the form of json
        API({
            method: 'post',
            url: "/api/userAdd",
            withCredentials: true,
            data: {
                send_to_id: result.db_id,
            }
        }).then((response) => {
            // check what our back-end Express will respond (Does it receive our data?)
            console.log(response.data);
            alert("Friend request has been sent to "+result.title+"!");
        }).catch((error) => {
            // if we cannot send the data to Express
            console.log("error when submitting: "+error);
            alert("failed to update these fields!");
        });
    }


    handleSearchChange = (e, { value }) => {
        this.setState({ isLoading: true, value });

        setTimeout(() => {
            if (this.state.value.length < 1) return this.setState(initialState);

                const re = new RegExp(_.escapeRegExp(this.state.value), "i");
                const isMatch = result => {return re.test(result.title) || re.test(result.email)};

                this.setState({
                isLoading: false,
                results: _.filter(source, isMatch)
            });
        }, 300);
    };

    render() {
        const { isLoading, value, results } = this.state;

        return (
            <Search
            loading={isLoading}
            onResultSelect={this.handleResultSelect}
            onSearchChange={_.debounce(this.handleSearchChange, 500, {
                leading: true
            })}
            results={results}
            value={value}
            resultRenderer={resultRenderer}
            {...this.props}
            placeholder='Search by email or name'
            />
        );
    }
}

UserSearch.defaultProps = {
    endpoint: "global",
    goal: "add_friend",
    action: () => {}
};
