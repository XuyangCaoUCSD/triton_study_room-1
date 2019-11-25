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
        messageNotification = <Label style={{right: "8%", top: "10%", zIndex: 10, position: 'absolute'}} circular color='red' empty></Label>;
    }

    let data = this.props.data;
    if (data.privateChat) {
        // Find the details of other user
        let otherUser = data.peopleDetails.find((info) => {
            return this.props.userEmail != info.email;
        });
                
        return (
            <Menu.Item as='a' onClick={this.props.onClickHandler} style={{ maxWidth: "100%", maxHeight: "100%"}}>
                {messageNotification}
                <Menu.Header>{otherUser.name}</Menu.Header>
                <Image circular src={data.img} style={{ maxWidth: "100%", maxHeight: "100%"}} />
            </Menu.Item>
        );
    }
    return (
        <Menu.Item as='a' onClick={this.props.onClickHandler} style={{ maxWidth: "100%", maxHeight: "100%"}}>
            {messageNotification}
            <Menu.Header>{data.groupName}</Menu.Header>
            <Image circular src={data.img} style={{ maxWidth: "100%", maxHeight: "100%"}} />
        </Menu.Item>
    );
  }
}

export default ChatGroupIcon;
