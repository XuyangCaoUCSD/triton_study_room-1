//jshint esversion: 6
import React, {Component} from 'react';
import { Button, Card, Image, Label, List } from 'semantic-ui-react';
import API from '../utilities/API';

class NotificationCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showCard: true,
      yourReaction: this.props.yourReaction,
      listOfReactions: this.props.listOfReactions
    };

    this._onAccept = this._onAccept.bind(this);
    this._onDecline = this._onDecline.bind(this);
    this.consumeCard = this.consumeCard.bind(this);
    this._acceptSession = this._acceptSession.bind(this);
    this._declineSession = this._declineSession.bind(this);
  }

  _acceptSession(event) {
    console.log("accepted study session!");
    //front end change
    let tempReactions = [...this.state.listOfReactions];
    for(var i = 0; i < tempReactions.length; i++) {
      if(tempReactions[i].person === "yourselfDiscovered") {
        tempReactions[i].reaction = "accept";
        continue;
      }
    }
    this.setState({yourReaction: "accept", listOfReactions: tempReactions});

    //front end change
    this.consumeCard("accepted");

  }

  _declineSession(event) {
    console.log("decline study session!");
    //front end change
    let tempReactions = [...this.state.listOfReactions];
    for(var i = 0; i < tempReactions.length; i++) {
      if(tempReactions[i].person === "yourselfDiscovered") {
        //too complex if temp and reassign, so I will just modify and forceUpdate
        tempReactions[i].reaction = "reject";
        continue;
      }
    }
    this.setState({yourReaction: "reject", listOfReactions: tempReactions});

    //back end change
    this.consumeCard("declined");
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


  customizeReaction(reactionType) {
    if(reactionType==="accept") {
      return(
        <List.Description style={{color: "green"}}>
        accepted
        </List.Description>
      );
    }
    else if(reactionType==="reject") {
      return(
        <List.Description style={{color: "red"}}>
        rejected
        </List.Description>
      );
    }
    else if(reactionType==="wait_response") {
      return(
        <List.Description style={{color: "purple"}}>
        waiting for the response
        </List.Description>
      );
    }
    else if(reactionType==="creator") {
      return(
        <List.Description style={{color: "blue"}}>
        creator
        </List.Description>
      );
    }
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
    else if(this.props.type === "study_session") {
      const items = [];
      for(var i = 0; i < this.props.listOfReactions.length; i++) {
        items.push(
          <List.Item key={i}>
            <Image avatar src={this.props.listOfReactions[i].avatar} />
            <List.Content>
              <List.Header as='a'>{this.props.listOfReactions[i].person === "yourselfDiscovered" ? "Yourself" : this.props.listOfReactions[i].name}</List.Header>
              {this.customizeReaction(this.props.listOfReactions[i].reaction)}
            </List.Content>
          </List.Item>
        );
      }

      return(
      <div>
        <h4>Note:<br/>{this.props.desc}</h4>
        <h4>Location:<br/>{this.props.location}</h4>
        <h5>Start time:<br/>{(new Date(this.props.start)).toString()}</h5>
        <h5>End time:<br />{(new Date(this.props.end)).toString()}</h5>
        <h4>People invovled:</h4>
        <List>{items}</List>
        

      </div>);
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
    else if(this.props.type === "study_session") {
      if(this.props.name === "creator") {
        return(
          <div className='ui two buttons'>
            <Button basic color='blue' disabled>
              You are the creator
            </Button>
          </div>
        );
      }
      else if(this.state.yourReaction === "reject") {
        return(
          <div className='ui two buttons'>
            <Button basic color='red' disabled>
              You rejected
            </Button>
          </div>
        );
      }
      else if(this.state.yourReaction === "accept") {
        return(
          <div className='ui two buttons'>
            <Button basic color='green' disabled>
              You accepted
            </Button>
          </div>
        );
      }
      else if(this.state.yourReaction === "wait_response") {
        return(
          <div className='ui two buttons'>
            <Button basic color='green' onClick={this._acceptSession}>
              Approve
            </Button>
            <Button basic color='red' onClick={this._declineSession}>
              Decline
            </Button>
          </div>
        );
      }
      
    }
  }

  generateHeader() {
    if(this.props.type === "study_session") {
      return this.props.info2;
    }
    else {
      return this.props.name;
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
            <Card.Header>{this.generateHeader()}</Card.Header>
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
