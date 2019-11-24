import axios from "axios";

///////////
// axios.defaults.withCredentials = true;  // otherwise {withCredentials: true} needed for all authentication-needed requests
//////////

// axios.defaults.withCredentials = true;
// export default axios;

export default axios.create({
  baseURL: "http://localhost:8181/"
});