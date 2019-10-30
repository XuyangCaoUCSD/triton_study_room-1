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
        let result = await auth.isAuthenticated();
        
        // Only set state if component is still there (not unmounted)
        if (this._isMounted) {
            if (result === true) {
                this.setState({
                    isAuthenticated: true
                });
                console.log(this.state.isAuthenticated);
            } else {
                console.log('Not Authenticated');
                this.setState({
                    isAuthenticated: false
                });
            }
        } 
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