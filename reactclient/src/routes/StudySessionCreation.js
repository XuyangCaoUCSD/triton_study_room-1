
import React, {Component} from 'react';
// we use axios for data communication between front-end and back-end
import { Button, Checkbox, Form, Image, Grid, List, Label } from 'semantic-ui-react'

import API from '../utilities/API';

import MultiUserSelect from "./MultiUserSelect";

export default class StudySessionCreation extends Component {
    constructor(props) {
        super(props);
    }


    render() {
        return(
            <MultiUserSelect creationType="createStudySession"/>
        );
    }


}