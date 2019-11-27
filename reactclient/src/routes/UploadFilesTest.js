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
import { Form, Message, Button, Image, Progress } from 'semantic-ui-react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

class UploadFileTest extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedFile: null,
            uploadProgress: 0,
            fileUploading: false
        }

        this.fileUploadHandler = this.fileUploadHandler.bind(this);
        this.fileSelectedHandler = this.fileSelectedHandler.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
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
        formData.append('namespaceFile', this.state.selectedFile, this.state.selectedFile.name);

        if (this._isMounted) {
            this.setState({
                fileUploading: true
            })
        }

        let endpoint = "/cse110";

        API({
            method: 'post',
            url: `/api/uploads/namespace${endpoint}`, // TODO remove hardcode endpoint
            withCredentials: true,
            data: formData, // Only send formData, otherwise multer has issues on backend
            onUploadProgress: progressEvent =>  {
                let percent = Math.round(progressEvent.loaded / progressEvent.total * 100)
                console.log('Upload progress: ' + percent);
                // set state to show progress
                if (this._isMounted) {
                    this.setState({uploadProgress: percent});
                }   

                // If done
                if (percent === 100) {
                    setTimeout(() => {
                        if (this._isMounted) {
                            this.setState({
                                fileUploading: false
                            });
                        }
                    }, 1500)
                }
            }
        }).then((res) => {
            console.log(`Post on uploads/namespace/${endpoint} route, Server responded with:`);
            console.log(res);

            let data = res.data;
            if (!data.success) {
                console.log('Failed file post API call');
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
                console.log('SUCCESSFULLY UPLOADED FILE!');
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
                <input type="file" onChange={this.fileSelectedHandler} />
                <br></br>
                <div style={{display: 'inline' }}>
                    <Button onClick={this.fileUploadHandler}>Upload File to namespace (20MB max.)</Button>
                    <span>
                        <div style={{ maxWidth: '150px'}}>
                            {progressBar}
                        </div>
                    </span>
                </div>
               
            </div>
        );
    }
    
}

export default UploadFileTest;