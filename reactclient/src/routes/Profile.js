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
import { Form, Message, Button, Image, Checkbox } from 'semantic-ui-react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

class Profile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedFile: null,
            avatarSource: null,
            avatarHash: Date.now(),
            uploadProgress: 0,
            fileUploading: false,
            aboutMe: "",
            phone: "",
            firstName: "",
            lastName: "",
            isChecked: true
        }

        this.fileUploadHandler = this.fileUploadHandler.bind(this);
        this.fileSelectedHandler = this.fileSelectedHandler.bind(this);
        this.onUpdateProfile = this.onUpdateProfile.bind(this);
        this.fetch_data = this.fetch_data.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;

        // Get user profile data
        this.fetch_data();

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

    // anytime when the component is loaded (refreshed using "F5"), the most updated value should be retrieved
    fetch_data() {
        API({
            // assemble HTTP get request
            // again include the user id so our backend will know who you are
            method: 'get',
            url: "/api/setting/dataRetrieve",
            withCredentials: true,
        }).then((response) => {
            // extract the data from the body of response
            console.log("data successfully retrieved from backend!");
            console.log(response.data);
            if (this._isMounted) {
                // assign what we received to the state variables which will be rendered
                this.setState({aboutMe: response.data.aboutMe});
                this.setState({phone: response.data.phone});
                this.setState({firstName: response.data.firstName});
                this.setState({lastName: response.data.lastName});
            }
            
        }).catch((error) => {
            // otherwise some error occurs
            console.log("error when submitting: "+error);
        });
    }

    // this function will be triggered when the "update" button is clicked
    // this function will send the updated value to the back-end Express (which will then store the data to MongoDB)
    onUpdateProfile(event) {
        event.preventDefault();
        // assemble HTTP post request
        // put the updated value (with user id) into the request body in the form of json
        API({
            method: 'post',
            url: "/api/setting",
            data: {
                aboutMe: this.state.aboutMe,
                phone: this.state.phone
            },
            withCredentials: true,
        }).then((response) => {
            // check what our back-end Express will respond (Does it receive our data?)
            console.log(response.data);
            alert("data updated successfully!");
        }).catch((error) => {
            // if we cannot send the data to Express
            console.log("error when submitting: "+error);
            alert("failed to update these fields!");
        });
    }

    toggleDisplayPhone = () => {
        this.setState({
            isChecked: !this.state.isChecked,
        });
    }


    fileSelectedHandler(e) {
        if (this._isMounted) {
            this.setState({
                selectedFile: e.target.files[0]
            });
        }
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

        if (this._isMounted) {
            this.setState({
                fileUploading: true
            })
        }
        

        API({
            method: 'post',
            url: "/api/uploads/avatars",
            withCredentials: true,
            data: formData, // Only send formData, otherwise multer has issues on backend
            onUploadProgress: progressEvent =>  {
                let percent = Math.round(progressEvent.loaded / progressEvent.total * 100)
                console.log('Upload progress: ' + percent);
                // set state to show progress
                if (this._isMounted) {
                    this.setState({uploadProgress: percent});
                }
                
                if (percent === 100) {
                    setTimeout(() => {
                        if (this._isMounted) {
                            this.setState({
                                fileUploading: false,
                                uploadProgress: 0
                            });
                        }
                    }, 1000)
                }
            }
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
                setTimeout(() => {
                    if (this._isMounted) {
                        window.location.reload()
                    }
                }, 1000);
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
        let progressBar = null;
        if (this.state.fileUploading) {
            progressBar = <CircularProgressbar value={this.state.uploadProgress} text={`${this.state.uploadProgress}%`} />;
        }
        

        return (
            <div>
                {errorDisplay}
    
                <h2 id="setting-title">My Profile and Settings <img id="gear" src="https://img.icons8.com/wired/64/000000/gear.png" /></h2>

                <input type="file" onChange={this.fileSelectedHandler} />
                <br></br>
                <div style={{display: 'inline' }}>
                    <Button onClick={this.fileUploadHandler}>Upload Avatar (1MB max.)</Button>
                    <span>
                        <div style={{ maxWidth: '150px'}}>
                            {progressBar}
                        </div>
                    </span>
                </div>
                
                <div>
                    <Image size='medium' src={`${this.state.avatarSource}?${this.state.avatarHash}`}></Image>
                </div>
                <h4>
                    First Name: {this.state.firstName} <br />
                    Last Name: {this.state.lastName}
                </h4>
                <Form method="post">
                    {/* <Form.Field>
                        <
                    </Form.Field> */}
                    <Form.Field>
                        <h4>About Me</h4>
                        <textarea style={{maxWidth:500}} class="box"  onChange={e => this.setState({aboutMe: e.target.value})} defaultValue={this.state.aboutMe}></textarea>
                    </Form.Field>
                    <Form.Field>
                        <h4>Phone Number</h4>
                        <input id="phone" style={{maxWidth:200}} type="text" onChange={e => this.setState({phone: e.target.value})} defaultValue={this.state.phone}></input>
                    </Form.Field>
                    <Form.Field>
                        <Checkbox checked={this.state.isChecked} onChange={this.toggleDisplayPhone} label='display my phone number to others' />
                    </Form.Field>
                    <Button color='green' onClick={this.onUpdateProfile}>Update</Button>
                </Form>
            </div>
        );
    }
    
}

export default Profile;