import PropTypes from "prop-types";
import _ from "lodash";
import React, { Component } from "react";
import { Search, Grid, Header, Segment, Label, Image, Button, Modal, List } from "semantic-ui-react";
import API from '../utilities/API';
import NotificationCard from './NotificationCard';


// resultRenderer.propTypes = {
//   title: PropTypes.string,
//   description: PropTypes.string,
// }



export default class UserSearch extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            results: [], 
            value: ""
        };

        this.source = [];

        this.initialState = {isLoading: false, results: [], value: ""};

        this.displayAccordingly = this.displayAccordingly.bind(this);
        this.resultRenderer = this.resultRenderer.bind(this);
    }


    resultRenderer = ({ avatar, title, about_me, email, is_friend}) => {
        return( 
        this.displayAccordingly(avatar, title, about_me, email, is_friend)
      );};
      
      
      // using this function to decide whether we need to display modals 
    displayAccordingly(avatar, title, about_me, email, is_friend) {
          if(this.props.goal === "add_friend") {
              //add modal here
              return (
              <Modal
                  closeIcon
                  size='small'  
                  trigger={
                        <div>
                            <div key="image" className="image">
                                <Image avatar src={avatar}></Image>
                            </div>
                            <div key="content" className="content">
                                {title && <div className="title">{title}</div>}
                                <div className="description">{email}</div>
                            </div>
                        </div>
                  }
              >
                  <Modal.Header>{title}</Modal.Header>
                  <Modal.Content image>
                      <Image wrapped size='medium' src={avatar} />
                      <Modal.Description>
                      <List>
                            <List.Item>
                            <List.Icon name='user' />
                            <List.Content>{title}</List.Content>
                            </List.Item>
                            <List.Item>
                            <List.Icon name='mail' />
                            <List.Content><a href={'mailto:'+email}>{email}</a></List.Content>
                            </List.Item>
                            <List.Item>
                            <List.Icon name='smile' />
                            <List.Content>
                                <p>{about_me ? about_me : 'The user has not written "about me" yet.'}</p>
                            </List.Content>
                            </List.Item>
                        </List>
                        {(is_friend === "Not your friend yet") ? <Button receiveremail={email} receivername={title} onClick={this.addFriend}>Add friend</Button> : <Label>{is_friend}</Label>}
                      </Modal.Description>
                  </Modal.Content>
              </Modal>
      
              );
      
          } else {
      
              return ( [
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
                  </div> ]
      
      
              );
      
          }
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
        if(this.props.goal !== "add_friend") {
            backendUrl = backendUrl + this.props.endpoint;
            console.log("the baseUrl is "+backendUrl);
        }

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
                this.source = response.data;
            }

        }).catch((error) => {
            // otherwise some error occurs
            console.log("error when submitting: "+error);
        });
    }

    handleResultSelect = (e, { result }) => {
        // e.preventDefault();
        this.setState({ value: result.title });
        if(this.props.goal === "multi_select") {
            console.log(result.title);
            this.props.uponSelection(result);
        }
        
    };

    // After discussion, this should be called somewhere else (like a user profile view page)
    addFriend(event) {

        console.log("this unique identifier is "+event.currentTarget.getAttribute("receiveremail"));

        const receiverName = event.currentTarget.getAttribute("receivername");

        // assemble HTTP post request
        // put the updated value (with user id) into the request body in the form of json
        API({
            method: 'post',
            url: "/api/userAdd",
            withCredentials: true,
            data: {
                send_to_email: event.currentTarget.getAttribute("receiveremail"),
            }
        }).then((response) => {
            // check what our back-end Express will respond (Does it receive our data?)
            console.log(response.data);
            alert("Friend request has been sent to "+receiverName+"!");
        }).catch((error) => {
            // if we cannot send the data to Express
            console.log("error when submitting: "+error);
            alert("failed to update these fields!");
        });
    }


    handleSearchChange = (e, { value }) => {
        this.setState({ isLoading: true, value });

        setTimeout(() => {
            if (this.state.value.length < 1) return this.setState(this.initialState);

                const re = new RegExp(_.escapeRegExp(this.state.value), "i");
                const isMatch = result => {return re.test(result.title) || re.test(result.email)};

                this.setState({
                isLoading: false,
                results: _.filter(this.source, isMatch)
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
            resultRenderer={this.resultRenderer}
            {...this.props}
            placeholder='Search by email or name'
            />

            
        );
    }
}

UserSearch.defaultProps = {
    endpoint: "/global",
    goal: "add_friend",
    uponSelection: () => {}
};
