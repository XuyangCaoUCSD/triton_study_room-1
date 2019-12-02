//jshint esversion: 6
import React, {Component} from 'react';
import { Card } from 'semantic-ui-react';
import NotificationCard from './NotificationCard';
import API from '../utilities/API';

export default class NotiCenter extends Component {

    constructor(props) {
        super(props);

        this.state = {
            notifications: []
        }

        this.generateCards = this.generateCards.bind(this);
    }

    componentDidMount() {
        this.fetch_data();
    }

    fetch_data() {
        API({
            // assemble HTTP get request
            method: 'get',
            url: "/api/NotiCenter",
            withCredentials: true
        }).then((response) => {
            // extract the data from the body of response
            console.log("data successfully retrieved from backend!");
            console.log(response.data);
            this.setState({notifications: response.data});

        }).catch((error) => {
            // otherwise some error occurs
            console.log("error when submitting: " + error);
        });
    }

    generateCards() {
        const cards = [];
        for (var i = 0; i < this.state.notifications.length; i++) {
            cards.push(
                <NotificationCard
                    key={i}
                    name={this.state.notifications[i].extra}
                    type={this.state.notifications[i].type}
                    trigger={this.state.notifications[i].trigger}
                    cardId={this.state.notifications[i]._id}
                    avatar={this.state.notifications[i].avatar}
                    email={this.state.notifications[i].triggerEmail}
                    info2={this.state.notifications[i].extra2}
                    spaceCreatorName={this.state.notifications[i].spaceCreatorName}
                    desc={this.state.notifications[i].desc}
                    listOfReactions={this.state.notifications[i].listOfReactions}
                    location={this.state.notifications[i].location}
                    yourReaction={this.state.notifications[i].yourReaction}
                    start={this.state.notifications[i].start}
                    end={this.state.notifications[i].end}
                />
            );
        }

        return cards;
    }

    render() {
        return (
            <div>
                <h1>Notifications</h1>
                <Card.Group>
                    {this.generateCards()}
                </Card.Group>
            </div>
            
        );
    }
}
