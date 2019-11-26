//jshint esversion: 6
import React, {Component} from 'react';
import { Button, Card, Image } from 'semantic-ui-react';
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
                    name={this.state.notifications[i].extra}
                    type={this.state.notifications[i].type}
                    trigger={this.state.notifications[i].trigger}
                    cardId={this.state.notifications[i]._id}
                    avatar={this.state.notifications[i].avatar}
                    email={this.state.notifications[i].triggerEmail} 
                />
            );
        }

        return cards;
    }

    render() {
        return (
            <Card.Group>
                {this.generateCards()}
            </Card.Group>
        );
    }
}
