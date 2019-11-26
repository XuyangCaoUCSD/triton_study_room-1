import React, {Component } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useHistory,
    useLocation
} from "react-router-dom";
import API from '../utilities/API';
import { Form, Message, Button, Image } from 'semantic-ui-react';

class Profile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedFile: null,
            avatarSource: null,
            avatarHash: Date.now()
        }

        this.fileUploadHandler = this.fileUploadHandler.bind(this);
        this.fileSelectedHandler = this.fileSelectedHandler.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
        // Get logged in user's avatar
        API({
            method: 'get',
            url: "/api/uploads/avatars",
            withCredentials: true,
        }).then((res) => {
            let data = res.data;
            if (!data.success) {
                console.log('Error while getting user avatar (user possibly has no avatar?)');
                if (data.errorMessage) {
                    console.log('Error message is ' + data.errorMessage);
                }
                return;
            }

            if (this._isMounted) {
                console.log('Setting current avatar');
                this.setState({
                    avatarSource: data.avatarUrl,
                    avatarHash: Date.now()
                });
            }
            

        }).catch((err) => {
            console.log(err);
        })
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    fileSelectedHandler(e) {
        this.setState({
            selectedFile: e.target.files[0]
        });
    }

    fileUploadHandler(e) {   
        if (!this.state.selectedFile) {
            this.setState({
                errorMessage: 'ERROR: NO FILE SELECTED'
            })
            console.log('ERROR: NO FILE SELECTED');
            return;
        }

        if (this._isMounted) {
            this.setState({
                errorMessage: null
            })
        }

        const formData = new FormData();
        formData.append('myAvatar', this.state.selectedFile, this.state.selectedFile.name);

        API({
            method: 'post',
            url: "/api/uploads/avatars",
            withCredentials: true,
            data: formData // Only send formData, otherwise multer has issues on backend
        }).then((res) => {
            console.log('Post on upload/avatar route, Server responded with:');
            console.log(res);

            let data = res.data;
            if (!data.success) {
                console.log('Failed avatar post API call');
                console.log('Error message is ');
                console.log(data.errorMessage);
                if (this._isMounted) {
                    this.setState({
                        errorMessage: data.errorMessage
                    });
                }
                
                return;
            }

            if (this._isMounted) {
                console.log('Setting new avatar');
                this.setState({
                    avatarSource: data.fileUrl,
                    avatarHash: Date.now()
                });
                this.forceUpdate();
            }

        }).catch((err) => {
            console.log('Error uploading file')
            console.log(err);
        });

    }

    render() {
        let errorDisplay = null;
        if (this.state.errorMessage) {
            errorDisplay = 
                <Message negative>
                    <Message.Header>Upload Error</Message.Header>
                    <p>{this.state.errorMessage}</p>
                </Message>
        }
        return (
            <div>
                {errorDisplay}
                <input type="file" name="myAvatar" onChange={this.fileSelectedHandler} />
                <br></br>
                <Button onClick={this.fileUploadHandler}>Upload Avatar (1MB max.)</Button>
                <div>
                    <Image size='medium' src={`${this.state.avatarSource}?${this.state.avatarHash}`}></Image>
                </div> 
            </div>
        );
    }
    
}

export default Profile;