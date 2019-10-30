import React, {Component} from "react";
import { Route, Redirect } from "react-router-dom";
import auth from "./auth";

export class ProtectedRoute extends Component {   
    constructor(props) {
        super(props);
        this._isMounted = false;

        const {component: Component, ...rest} = this.props;
        this.state = {Component, rest};
    }

    componentDidMount() {
        this._isMounted = true;
        this.isAuthenticated();
    }

    isAuthenticated = async () => {
        await auth.isAuthenticated()
        .then((res) => {
            console.log("Response is");
            console.log(res);
            if (this._isMounted) {
                if (res.data === true) {
                    console.log('changing state to true');
                    this.setState({
                        isAuthenticated: true
                    });
                    console.log(this.state.isAuthenticated);
                } else {
                    console.log('not authenticated');
                    this.setState({
                        isAuthenticated: false
                    });
                }
            }
            
        }).catch((err) => {
            console.log("Error checking authentication.");
            console.log(err);
            if (this._isMounted) {
                this.setState({
                    isAuthenticated: false
                });
            }
        });
    }

    componentWillUnmount() {
        // Avoid memory leak (setting state after component unmounted)
        this._isMounted = false;
    }

    render() {
        if (this.state.isAuthenticated != null) {
            if (this.state.isAuthenticated) {
                return(
                    <Route
                        {...this.state.rest}
                        render={
                            (props) => {
                                return <this.state.Component {...props} />
                            }
                        }
                    />
                )
            } else {
                return(
                    <Route
                        {...this.state.rest}
                        render={
                            (props) => {
                                // return <Redirect to="/"/>

                                // can use object to track redirector's location https://reacttraining.com/react-router/web/api/Redirect
                                return <Redirect 
                                            to={{
                                                pathname: "/",
                                                state: {
                                                    from: props.location  // location auto passed in by Route component to ...rest
                                                }
                                            }}   
                                        />              
                            }
                        }
                    />
                )
            }
        } else {
            // Loading temp render
            return <Route
                        {...this.state.rest}
                        render={
                            () => {
                                return (
                                    <div> Loading </div>
                                )
                            }
                        }
                    />
        }
        
    }
}