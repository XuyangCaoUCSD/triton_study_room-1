import React from "react";
import { Route, Redirect } from "react-router-dom";
import Loading from "../Loading";

export const ProtectedRoute = ({ component: Comp, isLoggedIn, path, authMemoHandler, ...rest }) => {
    if (isLoggedIn === null) {
        // Recheck login status if not sure if logged in
        console.log('Calling authMemoHandler in protectedroute');
        authMemoHandler();

        return (
            <Loading type="spinningBubbles" color="#0B6623" />
        );
    } else {
        return (
            <Route
                path={path}
                {...rest}
                render={(props) => {
                    return isLoggedIn ? (
                        <Comp {...props} />
                    ) : (
                        <Redirect
                            to={{
                                pathname: "/login",
                                state: {
                                    from: path,
                                    loginError: true,
                                },
                            }}
                        />
                    );
                }}
            />
        );
    }
    
};