import React, {Component} from 'react';
import API from './utilities/API';

class ChatGroupIcon extends Component {
  constructor(props) {
    super(props);
    this.state = {}
  }

 

  componentDidMount() {
      // TODO remove click handler
  }

  render() {
    // console.log("this.props.data in ChatGroupIcon is");
    // console.log(this.props.data);
    return (
        <div onClick={this.props.onClickHandler} className="chat-group-icon" style={{ "border": "solid black", "width": "90px", "height": "50px", "background": "green"}}>
            <img src={this.props.data.img} style={{ "maxWidth": "100%", "maxHeight": "100%"}}></img>
        </div>
    );
  }
}

export default ChatGroupIcon;
