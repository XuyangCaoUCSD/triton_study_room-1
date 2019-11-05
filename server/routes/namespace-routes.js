const  express       = require('express'),
       User          = require('../models/User'),
       middleware    = require('../middleware/index');

var router = express.Router();
let namespaces = require('../data/namespaces');  // Temp

router.get('/:name', middleware.isLoggedIn, (req, res) => {
    // TODO Find if namespace name exists in db
    console.log('req.params is');
    console.log(req.params);

    if (req.params.name !== 'cse110') {
        console.log('Error, Use cse110 for testing purposes!');
    }

    // Use cse 110 namespace by default for now, and use general (first) room by default
    let currNs = namespaces[0];
    currNs.rooms[0].history.push('Hello Buddy', 'Hi there', 'Lorem Ipsum');  

    let data = {
        success: true,
        nsData: null,
        currNs
    }

    let nsData = namespaces.map((ns) => {
        return {
            img: ns.img,
            endpoint: ns.endpoint
        }
    });

    data.nsData = nsData;

    // Send over namespace data 
    res.send(data);
});

module.exports = router;