const  express       = require('express'),
       User          = require('../models/User'),
       middleware    = require('../middleware/index'),
       Namespace     = require('../models/Namespace');

const router = express.Router();
let namespaces = require('../data/namespaces');  // Temp

router.get('/:name', middleware.isLoggedIn, (req, res) => {
    console.log('req.params is');
    console.log(req.params);

    if (req.params.name !== 'cse110') {
        console.log('Error, Use cse110 for testing purposes!');
    }

    let userId = req.session.passport.user;

    let data = {
        success: true,
        nsData: null,
        currNs: null
    }

    // Use cse 110 namespace by default for now, and use general (first) room by default
    // Find if namespace name exists in db
    Namespace.findOne({
        groupName: req.params.name
    }).then((namespace) => {
        if (!namespace) {
            data.success = false;
            console.log('Error, namespace not found');
            res.send(data);
        } else {
            data.currNs = namespace;
            
            // Populate nsData
            User.findById(userId).populate("namespaces").exec((err, foundUser) => {
                if (err || !foundUser) {
                   console.log(err);
                   console.log('User not found')
                } else {
                    // console.log(foundUser);
                    let nsData = foundUser.namespaces.map((ns) => {
                        return {
                            img: ns.img,
                            endpoint: ns.endpoint
                        }
                    });

                    // console.log('nsData is');
                    // console.log(nsData);
                    
                    data.nsData = nsData;

                    // Todo Put in last callback / promise resolution needed for information retrieval
                    // Send over namespace data 
                    res.send(data);        
                }
            });    
        }
    }).catch((err) => {
        console.log(err);
    })
    
});

module.exports = router;