
import API from "../utilities/API";

class Auth {
    constructor() {
    }

    // Local Strategy
    // Pass in login data and callback
    login(data, successCallback, errorCallback) {
        API({
            method: 'post',
            url: `/api/login`,
            data,
            withCredentials: true
        })
        .then((res) => {
            console.log(res);
            successCallback(res);
        })
        .catch((err) => {
            console.log("Error logging in");
            console.log(err);
            errorCallback(err);
        });
    }

    googleLogin(successCallback, errorCallback) {
        const auth_route_link = 'http://localhost:8181/api/auth/google';
        window.open(auth_route_link, "_blank"); // Open new tab, best solution for now
        // window.location.replace(auth_route_link);   

        // Todo
        successCallback();
    }

    logout(successCallback, errorCallback) {
        API({
            method: 'get',
            url: `/api/logout`,
            withCredentials: true
        })
        .then((res) => {
            console.log("Check response is");
            console.log(res);
            successCallback(res);
            // const data = res.data;
            // this.setState({});
        })
        .catch((err) => {
            console.log("Failed check");
            console.log(err);
            errorCallback(err);
        });
    }

    isAuthenticated() {
        // Returns Promise
        return API({
            method: 'get',
            url: `/api/isLoggedIn`,
            withCredentials: true
        
        })
    }
    

}

export default new Auth();