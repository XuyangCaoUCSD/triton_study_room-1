import React, {Component} from 'react';
import { Menu, Image, Label } from 'semantic-ui-react';
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

    // console.log('this.props.hasNotifications in ChatGroupIcon is');
    // console.log(this.props.hasNotifications);

    // Notification for messages
    let messageNotification = null;
    if (this.props.hasNotifications) {
        messageNotification = <Label style={{display: 'flex', justifyContent: 'space-between'}} circular color='red' empty></Label>;
    }
    return (
        // <div onClick={this.props.onClickHandler} className="chat-group-icon" style={{ "border": "solid black", "width": "90px", "height": "50px", "background": "green"}}>
        //     <Image src={this.props.data.img} style={{ "maxWidth": "100%", "maxHeight": "100%"}} />
        // </div>
        <Menu.Item as='a' onClick={this.props.onClickHandler} style={{ "maxWidth": "100%", "maxHeight": "100%"}}>
            {messageNotification}
            <Menu.Header>{this.props.data.groupName}</Menu.Header>
            <Image circular src={this.props.data.img} style={{ "maxWidth": "100%", "maxHeight": "100%"}} />
        </Menu.Item>
    );
  }
}

export default ChatGroupIcon;
