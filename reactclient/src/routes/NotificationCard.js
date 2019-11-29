//jshint esversion: 6
import React, {Component} from 'react';
import { Button, Card, Image } from 'semantic-ui-react';
import API from '../utilities/API';

class NotificationCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showCard: true
    };

    this._onAccept = this._onAccept.bind(this);
    this._onDecline = this._onDecline.bind(this);
    this.consumeCard = this.consumeCard.bind(this);
  }

  _onAccept(event) {
    console.log("accepted!");
    this.setState({showCard: false});
    this.consumeCard("accepted");

    //if the card is a "namespace_invite"
    if(this.props.type === "namespace_invite") {
      this.handleUserInvite("accepted");
    }
  }

  _onDecline(event) {
    console.log("declined!");
    this.setState({showCard: false});
    this.consumeCard("declined");

    if(this.props.type === "namespace_invite") {
      this.handleUserInvite("declined");
    }
  }

    handleUserInvite(choice) {
        let backendUrl = "/api/namespace"+this.props.info2;
        if(choice === "accepted") {
            backendUrl = backendUrl + "/add-user";
        }
        else if(choice === "declined") {
            backendUrl = backendUrl + "/remove-invite";
        }

        console.log("BACKEND ROUTE is "+backendUrl);

        API({
            method: 'patch',
            url: backendUrl,
            withCredentials: true,
        }).then((response) => {
            // check what our back-end Express will respond (Does it receive our data?)
            console.log(response.data);
        }).catch((error) => {
            // if we cannot send the data to Express
            console.log("error when submitting: "+error);
            alert("failed to update these fields!");
        });


  }

  //user clicked one of the button and we send data to the backend
  //choice (string) can either be "accepted" or "declined" based on what the user clicked
  consumeCard(choice) {
    API({
        method: 'post',
        url: "/api/NotiCenter/consumeCard",
        withCredentials: true,
        data: {
            choice: choice,
            type: this.props.type,
            trigger: this.props.trigger,
            cardId: this.props.cardId,
        }
    }).then((response) => {
        // check what our back-end Express will respond (Does it receive our data?)
        console.log(response.data);
    }).catch((error) => {
        // if we cannot send the data to Express
        console.log("error when submitting: "+error);
        alert("failed to update these fields!");
    });
  }


  generateDynamicContent() {
    if(this.props.type === "friend_request") {
      return (this.props.name+" sent you a friend request.");
    }
    else if(this.props.type === "friend_accepted") {
      return (this.props.name+" accepted your friend request.");
    }
    else if(this.props.type === "namespace_invite") {
      return ("You are invited to join the study group "+this.props.name+" created by "+this.props.spaceCreatorName+".");
    }
  }

  generateButtons() {
    if(this.props.type === "friend_request" || this.props.type === "namespace_invite") {
      return (    <div className='ui two buttons'>
                    <Button basic color='green' onClick={this._onAccept}>
                      Approve
                    </Button>
                    <Button basic color='red' onClick={this._onDecline}>
                      Decline
                    </Button>
                  </div>);
    }
    else if(this.props.type === "friend_accepted") {
      return (    <div className='ui two buttons'>
                    <Button basic color='purple' onClick={this._onDecline}>
                      Dismiss
                    </Button>
                  </div>);
    }
  }

  render() {
    return ( this.state.showCard ?
        <Card>
          <Card.Content>
            <Image
              floated='right'
              size='mini'
              src={this.props.avatar}
            />
            <Card.Header>{this.props.name}</Card.Header>
            <Card.Meta>{this.props.email}</Card.Meta>
            <Card.Description>
              {this.generateDynamicContent()}
            </Card.Description>
          </Card.Content>
          <Card.Content extra>
            {this.generateButtons()}
          </Card.Content>
        </Card> :
        null
      );
  }


}

export default NotificationCard;
