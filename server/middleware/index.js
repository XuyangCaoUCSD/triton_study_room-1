var middlewareObj = {};

middlewareObj.isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
        console.log(req.user)
		return next();
    } 

    console.log(req.user);
    console.log(req.session);
	req.flash("error", "You need to be logged in first to do that");  // Key value pair arg to display on next redirect / next route
    
    res.statusMessage = "NOT LOGGED IN!";
    res.status(401);
    res.send("ERROR, NOT LOGGED IN");
}

module.exports = middlewareObj;