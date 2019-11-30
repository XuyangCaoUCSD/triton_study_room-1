import React, {Component} from 'react';
import { Menu, Image, Label, Button, Icon } from 'semantic-ui-react';
import API from './utilities/API';
import Modal from 'react-awesome-modal';
import Loading from "./Loading";

class ChatGroupIcon extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: this.props.data,
            hasNotifications: null, // Set in did mount
            endpoint: null, // set in did mount
            confirmRemoveOpen: false
        }

        this.removeFromNamespaceAPI = this.removeFromNamespaceAPI.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;

        // Set props in did mount to change on props update (if in constructor, will ignore updates) (check out react documentation)
        this.setState ({
            data: this.props.data,
            hasNotifications: this.props.hasNotifications,
            endpoint: this.props.data ? this.props.data.endpoint : null,
            confirmRemoveOpen: false
        });
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    removeClickHandler = (e) => {
        // e.preventDefault();
        this.setState({
            confirmRemoveOpen: true
        });
    }

    confirmRemove = (e) => {
        
        this.removeFromNamespaceAPI();
    }
    
    closeConfirmModal = (e) => {
        this.setState({
            confirmRemoveOpen: false
        });
    }

    removeFromNamespaceAPI() {
        
        if (!this.state.data || !this.state.data.endpoint) {
            console.log('No data or endpoint to call remove from namespace API');
            return;
        }
        console.log('Calling remove from namespace API');
        API({
            method: 'patch',
            url: `/api/namespace${this.state.endpoint}/remove-user`,
            withCredentials: true
        }).then((res) => {
            let data = res.data;
            if (!data.success) {
                console.log('Failed to remove user from namespace');
                return;
            }
            
            this.setState({
                confirmRemoveOpen: false
            });
            // Update groups display
            this.props.removeGroup(this.state.endpoint);

        }).catch((err) => {
            console.log('ERROR on removing user from namespace')
            console.log(err);
        });
    }

    render() {
        if (!this.state.data) {
            return <Loading type="spinningBubbles" color="#0B6623" />
        }

        if (this.state.confirmRemoveOpen) {
            return (
                <Modal
                    visible={this.state.confirmRemoveOpen} 
                    width="30%" 
                    height="25%" 
                    effect="fadeInUp" 
                    onClickAway={this.closeConfirmModal}
                >
                    <div>
                        <h3>Are you sure you want to leave this group permanently?</h3>
                        <br></br>
                        <Button onClick={this.closeConfirmModal}>Cancel</Button> <Button onClick={this.confirmRemove} negative>Confirm</Button>
                    </div>
                </Modal>
            )
        }
        // console.log("this.props.data in ChatGroupIcon is");
        // console.log(this.props.data);

        // console.log('this.props.hasNotifications in ChatGroupIcon is');
        // console.log(this.props.hasNotifications);

        // Notification for messages
        let messageNotification = null;
        // console.log('this.state.hasNotifications is');
        // console.log(this.state.hasNotifications);
        // TODO ONLY PROPS WORK
        if (this.props.hasNotifications) {
            messageNotification = <Label style={{right: "8%", top: "10%", zIndex: 10, position: 'absolute'}} circular color='red' empty></Label>;
        }

        let data = this.state.data;
        let clickHandler = this.props.onClickHandler;

        // Will be truthy when user press edit groups
        let editingGroups = this.props.editingGroups;
        let removeDiv = null;

        if (editingGroups) {
            clickHandler = null; // Don't allow redirection to namespace when editing group
            removeDiv = 
                <div style={{position: 'absolute', textAlign: 'center', bottom: '23%', left: '0%', zIndex: 11}}>
                    <Button onClick={this.removeClickHandler} size='huge' negative circular icon>
                        <Icon name='delete'></Icon>
                    </Button>
                </div>;
        }
        

        if (data.privateChat) {
            // Find the details of other user
            let otherUser = data.peopleDetails.find((info) => {
                return this.props.currUserEmail !== info.email;
            });
                    
            return (
                <Menu.Item as='a' onClick={clickHandler} style={{ maxWidth: "100%", maxHeight: "100%"}}>
                    {removeDiv}
                    {messageNotification}
                    <Menu.Header>{otherUser.name}</Menu.Header>
                    <Image circular src={data.img} style={{ maxWidth: "100%", maxHeight: "100%"}} />
                </Menu.Item>
            );
        }
        return (
            <Menu.Item as='a' onClick={clickHandler} style={{ maxWidth: "100%", maxHeight: "100%"}}>
                {removeDiv}
                {messageNotification}
                <Menu.Header>{data.groupName}</Menu.Header>
                <Image circular src={data.img} style={{ maxWidth: "100%", maxHeight: "100%"}} />
            </Menu.Item>
        );
    }
}

export default ChatGroupIcon;
