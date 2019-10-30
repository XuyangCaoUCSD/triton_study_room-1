import React from 'react';

const UserForm = (props) => {
    return (
        <form style={{ textAlign: "center" }} onSubmit={props.getUser}>
            <input style={{ margin: "20px auto", display: "block" }} type="text" name="username" placeholder="username"/>
            <input style={{ margin: "20px auto", display: "block" }} type="password" name="password" placeholder="password"/>
            <button>Submit</button>
        </form>
    );
}

export default UserForm;