import React, {Component } from 'react';
import API from '../utilities/API';
import { Form, Header, Segment, Message, Button, Image, Icon } from 'semantic-ui-react';
import 'react-circular-progressbar/dist/styles.css';
import Loading from "../Loading";
import Linkify from 'react-linkify';

class FilesView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            endpoint: this.props.endpoint,
            files: []
        }

        this.buildFile = this.buildFile.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
        if (!this.state.endpoint) {
            return;
        }
        API({
            method: 'get',
            url: `/api/uploads/namespace${this.state.endpoint}`,
            withCredentials: true
        }).then((res) => {
            console.log('Get on uploads namespace files route, Server responded with:');
            console.log(res);

            let data = res.data;
            console.log(data);

            // Avoid memory leak
            if (!this._isMounted) {
                return;
            }

            if (!data.success) {
                console.log('Failed API call');    
            }

            if (this._isMounted) {
                this.setState({
                    files: data.files
                });
            }    

        }).catch((err) => {
            console.log("Error while getting Namespace route, logging error: \n" + err);
            // Either use toString or ==
            if (err.response && err.response.status) {
                console.log('err.response is: \n');
                console.log(err.response);

                let statusCode = err.response.status.toString();
                if (statusCode === "401") {
                    console.log("ERROR code 401 received - UNAUTHENTICATED");
                    this.props.history.push("/login/error");
                } else if (statusCode === "403") { 
                    console.log("ERROR code 403 received - UNAUTHORISED CREDENTIALS");
                    this.setState({
                        unauthorised: true
                    });
                }
                
            }

        });
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    buildFile(fileInfo, listKey) {
        // return (
        //     <li key={listKey}>
        //         <Message style={{whiteSpace: 'pre-wrap'}}>
        //             <div>
        //                 <div>
        //                     <Header size='small'>{fileInfo.originalName}</Header>
        //                 </div>            
        //                 <div>
        //                     <Linkify>
        //                         {fileInfo.url}
        //                     </Linkify>
        //                 </div>              
        //             </div>   
        //         </Message>
        //     </li>
        // ); 

        return (
            <li key={listKey}>
                <Message style={{whiteSpace: 'pre-wrap'}}>
                    <div>
                        <div>
                            <Header size='small'><a href={fileInfo.url}>{fileInfo.originalName}</a></Header>
                        </div>          
                    </div>   
                </Message>
            </li>
        ); 
    }

    render() {
        if (!this.state.files) {
            return <Loading type="spinningBubbles" color="#0B6623" />;
        }
        
        let filesList = [];

        let currFiles = this.state.files;
        Object.entries(currFiles).forEach(([key, fileInfo]) => {
            filesList.push(this.buildFile(fileInfo, key))
        });

        console.log('filesList is ');
        console.log(filesList);

        return (
            <Segment color="teal" style={{overflowY: 'scroll', height: '100%', width: '100%', wordWrap: 'break-word'}}>
                <ul style={{listStyleType: "none", padding: 0}}>
                    {filesList}
                </ul>
            </Segment>
        );
    }
    
}

export default FilesView;