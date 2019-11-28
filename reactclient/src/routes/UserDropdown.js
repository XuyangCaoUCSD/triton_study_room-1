import React, {Component} from "react";
import { Dropdown, Grid } from "semantic-ui-react";
import API from '../utilities/API';

const friendOptions = [
  {
    key: "Jenny Hess",
    text: "Jenny Hess",
    value: "Jenny Hess",
    image: {
      avatar: true,
      src: "https://react.semantic-ui.com/images/avatar/small/jenny.jpg"
    },
    description: "wow@ucsd.edu"
  },
];

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
        var baseUrl = "/api/userSearch";
        if(this.props.namespace !== "global") {
            baseUrl = baseUrl + "/" + this.props.namespace;
        }
        console.log("the baseUrl is "+baseUrl);
        
        API({
            // assemble HTTP get request
            method: 'get',
            url: baseUrl,
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
                   this.state.dropdownView.push(user);
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
    namespace: "global",
    action: () => {}
};

export default UserDropdown;