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

const initialState = { isLoading: false, results: [], value: ""};

export default class SearchExampleStandard extends Component {
    state = initialState;

    componentDidMount() {
        this.fetch_data();
    }

    fetch_data() {
        API({
            // assemble HTTP get request
            method: 'get',
            url: "/api/userSearch",
            withCredentials: true
        }).then((response) => {
            // extract the data from the body of response
            console.log("data successfully retrieved from backend!");
            console.log(response.data);
            source = response.data;

        }).catch((error) => {
            // otherwise some error occurs
            console.log("error when submitting: "+error);
        });
    }



    handleResultSelect = (e, { result }) => {
        // e.preventDefault();
        this.setState({ value: result.title })

        if (result.is_friend === "You are friends!") {
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

    };


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
            <Grid>
                <Grid.Column width={6}>
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
                </Grid.Column>
                <Grid.Column width={10}>
                    <Segment>
                    <Header>State</Header>
                    <pre style={{ overflowX: "auto" }}>
                        {JSON.stringify(this.state, null, 2)}
                    </pre>
                    <Header>Options</Header>
                    <pre style={{ overflowX: "auto" }}>
                        {JSON.stringify(source, null, 2)}
                    </pre>
                    </Segment>
                </Grid.Column>
            </Grid>
        );
    }
}
