
import React, {Component} from 'react';
// we use axios for data communication between front-end and back-end
import MultiUserSelect from "./MultiUserSelect";

export default class StudySessionCreation extends Component {

    render() {
        return(
            <MultiUserSelect endpoint="/friend" creationType="createStudySession"/>
        );
    }


}