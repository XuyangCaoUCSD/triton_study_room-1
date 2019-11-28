import React, {Component} from "react";
import { Dropdown, Grid } from "semantic-ui-react";
import API from '../utilities/API';


class UserDropdown extends Component {
    constructor(props) {
        super(props);

        //dropdownView stores the array for Dropdown component
        //source stores the data suitable for the parent component MultiUserSelect to process
        this.state = {
            dropdownView: [],
            source: []
        }

    }

    componentDidMount() {
        this._isMounted = true;
        this.fetch_data();
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
                this.setState({source: response.data});
                for(var i = 0; i < response.data.length; i++) {
                   let user = {
                        key: response.data[i].title,
                        text: response.data[i].title,
                        value: response.data[i].title,
                        image: {
                            avatar: true,
                            src: response.data[i].avatar
                        },
                        "sourceindex": i,
                        description: response.data[i].email,                       
                        onClick: e => {
                            let index = e.currentTarget.getAttribute("sourceindex");
                            this.props.action(this.state.source[index]);
                          }
                   };
                   const usersCollected = this.state.dropdownView.concat(user);
                   this.setState({dropdownView: usersCollected});
               }
            }

        }).catch((error) => {
            // otherwise some error occurs
            console.log("error when submitting: "+error);
        });
    }



    render() {
        return (
            
            <Dropdown
            placeholder="Or select a user directly"
            fluid
            selection
            options={this.state.dropdownView}
            />
            
        );
    }
}

UserDropdown.defaultProps = {
    endpoint: "global",
    action: () => {}
};

export default UserDropdown;