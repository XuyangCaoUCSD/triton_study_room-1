const  express       = require('express'),
       User          = require('../models/User'),
       middleware    = require('../middleware/index'),
       Namespace     = require('../models/Namespace');

const { ChatHistory } = require('../models/ChatHistory');

const router = express.Router();

router.get('/:namespace', middleware.isLoggedIn, (req, res) => {
    console.log('req.params is');
    console.log(req.params);

    if (req.params.namespace !== 'cse110') {
        console.log('Error, Use cse110 for testing purposes!');
    }

    let userId = req.session.passport.user;

    let data = {
        success: true,
        nsData: null,
        currNs: null,
        currRoom: null
    }

    // Use cse 110 namespace by default for now, and use general (first) room by default
    // Find if namespace name exists in db
    Namespace.findOne({
        groupName: req.params.namespace
    }) //.populate({ path: 'rooms', populate: { path: 'chatHistory', model: 'ChatHistory' }})
    .exec((err, foundNamespace) => {
        if (err || !foundNamespace) {
            if (err) {
                console.log(err);
            }
            data.success = false;
            console.log('Error, namespace not found');
            res.send(data);
        } else {
            data.currNs = foundNamespace;
            let currRoom = foundNamespace.rooms[0]; // Use Default first room to join
            let chatHistoryId = currRoom.chatHistory; 

            ChatHistory.findById(chatHistoryId)
            .then((foundChatHistory) => {
                console.log('foundChatHistory is:');
                console.log(foundChatHistory);
                currRoom.chatHistory = foundChatHistory;  // Replace id in currRoom var with actual messages
                data.currRoom = currRoom;
                
                // Populate user's nsData
                User.findById(userId).populate('namespaces').exec((err, foundUser) => {
                    if (err || !foundUser) {
                    console.log(err);
                    console.log('User not found')
                    } else {

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

            }).catch((err) => {
                console.log(err);
            })

        }
    });
    
});

module.exports = router;