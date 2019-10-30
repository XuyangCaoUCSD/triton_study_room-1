import React, {Component} from 'react';
import API from './utilities/API';

class ChatGroupIcon extends Component {
  constructor(props) {
    super(props);
    this.state = {}
    this.clickHandler = this.clickHandler.bind(this);
  }

  clickHandler() {
    // Get request to get info for current namespace
    API({
        method: 'get',
        url: this.props.data.endpoint,
        withCredentials: true
  
    }).then((res) => {
            console.log(`${this.props.data.endpoint} API responded with`);
            console.log(res);
    }).catch((err) => {
        console.log(err);
        console.log(`Err in getting ${this.props.data.endpoint} info`);
    });
  }

  componentDidMount() {
      // TODO remove click handler
  }

  render() {
    console.log("this.props.data in ChatGroupIcon is");
    console.log(this.props.data);
    return (
        <div onClick={this.clickHandler} className="chat-group-icon" style={{ "border": "solid black", "width": "100px", "height": "100px", "background": "green"}}>
            <img src={this.props.data.img} style={{ "maxWidth": "100%", "maxHeight": "100%"}}></img>
        </div>
    );
  }
}

export default ChatGroupIcon;
