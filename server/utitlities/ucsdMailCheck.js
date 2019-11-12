module.exports = {
    checkMail: (email) => {
        const allowed_domain = "ucsd.edu";
        // Check to make sure domain is UCSD account
        // // negative important in slice to get last characters
        if (email.slice(-allowed_domain.length) != allowed_domain) {
            console.log("NOT UCSD ACCOUNT!")
            return false;
        }

        return true;
    },
};