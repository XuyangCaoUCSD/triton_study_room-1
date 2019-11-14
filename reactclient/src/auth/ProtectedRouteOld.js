import React, {Component} from "react";
import { Route, Redirect } from "react-router-dom";
import auth from "./auth";
import Loading from "../Loading";

export class ProtectedRoute extends Component {   
    constructor(props) {
        super(props);
        this._isMounted = false;

        const {component: Component, ...rest} = this.props;
        this.state = {Component, rest};
        this.redirectHandler = this.redirectHandler.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
        this.isAuthenticated();
    }

    isAuthenticated = async () => {
        let result = await auth.isAuthenticated();
        
        // Only set state if component is still there (not unmounted) to avoid memory leak
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
        console.log('Unmounting protected route');
        // Avoid memory leak (setting state after component unmounted)
        this._isMounted = false;
    }

    redirectHandler(redirectTo) {
        console.log('Redirect Handler being executed');
        // this.setState({
        //     redirectTo
        // });
        this.redirectTo = redirectTo;
        console.log('set redirectTo to ' + redirectTo);
        
        this.forceUpdate();
    }

    render() {
        if (this.state.isAuthenticated != null) {
            if (this.state.isAuthenticated === true) {
                if (this.redirectTo) {
                    console.log('Redirecting to namespace ' + this.redirectTo);
                    let redirectTo = this.redirectTo;
                    this.redirectTo = null;
                    return (
                        <Route 
                            {...this.state.rest}
                            render={
                                (props) => {
                                    return (
                                        <Redirect
                                            to={{
                                                pathname: redirectTo,
                                                state: {
                                                    from: props.location
                                                }
                                            }}   
                                        />
                                    )              
                                }
                            }
                        />
                        
                    )

                } else {
                    // Regular component
                    return(
                        <Route
                            {...this.state.rest}
                            render={
                                (props) => {
                                    return <this.state.Component {...props} redirectHandler={this.redirectHandler} />
                                }
                            }
                        />
                    )
                }
            } else {
                console.log('Redirecting as not authenticated');
                // can use object to track redirector's location https://reacttraining.com/react-router/web/api/Redirect
                return (
                    <Route 
                        {...this.state.rest}
                        render={
                            (props) => {
                                return (
                                    <Redirect
                                        to={{
                                            pathname: "/login",
                                            state: {
                                                loginError: true,
                                                from: props.location
                                            }
                                        }}   
                                    />
                                )              
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
                            (props) => {
                                return (
                                    <Loading type="spinningBubbles" color="#0B6623" />
                                )
                            }
                        }
                    />
        }
        
    }
}