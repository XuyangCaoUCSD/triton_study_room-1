const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const middleware = require('../middleware/index');

const router = express.Router();

const User = require('../models/User');
const Namespace = require('../models/Namespace');

let avatarDestination = './uploads/avatars';  // IMPORTANT Path relative to SERVER folder (not this file);

// Set The Storage Engine
const avatarStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, avatarDestination);
    },
    filename: function(req, file, cb) {
        // Expects req.userEmail to be set
        cb(null, req.userEmail + path.extname(file.originalname));
    }
});

// Init Upload for avatars
const avatarUpload = multer({
    storage: avatarStorage,
    limits: {fileSize: 1048576}, // in bytes (so 1 MB);
    fileFilter: function(req, file, cb){
        avatarCheckFileType(file, cb);
    }
}).single('myAvatar');

// Check File Type
function avatarCheckFileType(file, cb){
    // Allowed extensions
    const filetypes = /jpeg|jpg|png/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb({message: 'Error: Images Only (jpeg, jpg, png)!'});
    }
}

// Retrieve avatar from file path (optional fileName--if blank retrieve logged in user's avatar)
router.get("/avatars/:fileName?", middleware.isLoggedIn, (req, res) => {
    let fileName = req.params.fileName;
    let userId = req.session.passport.user;

    // console.log('\n Reached get route for avatars');
    
    // If no fileName param send avatar of user who made request
    if (!fileName) {
        // console.log("No file name, getting logged in user's avatar");
        let data = {
            success: true
        }
        User.findById(userId).select('avatar').then((foundUser) => {
            if (!foundUser) {
                console.log('Could not find user');
                data.success = false;
                data.errorMessage = 'Could not find user';
                res.send(data);
            }

            data.avatarUrl = foundUser.avatar;
            res.send(data);
        }).catch((err) => {
            console.log(err);
        })
        
    } else {
        // If fileName is in parameters

        // Check if file exists, then decide what to do
        fs.access(path.resolve(`./uploads/avatars/${fileName}`), fs.F_OK, (err) => {
            if (err) {
              console.error(err);
              console.log('AVATAR NO EXIST, SENDING DEFAULT');
              // Send default avatar
              res.sendFile(path.resolve(`./uploads/avatars/DEFAULT_USER_123.png`));
              return;
            }
          
            // file exists, send user avatar
            res.sendFile(path.resolve(`./uploads/avatars/${fileName}`));	
        });
        
    }
     
    
});

router.post('/avatars', middleware.isLoggedIn, (req, res) => {
    console.log('Reached post route for /api/uploads/avatars');
    let userId = req.session.passport.user;
    User.findById(userId).select('email').then((foundUser) => {
        let data = {
            success: true
        }
        
        // Make email available in one of multer's setup function to determine file name
        req.userEmail = foundUser.email;

        avatarUpload(req, res, (err) => {
            if (err) {
                data.success = false;
                console.log(err);
                data.errorMessage = err.message;
                console.log('Error in upload');
                res.send(data);
            } else {
                if (req.file == undefined) {
                    data.success = false;
                    data.errorMessage = 'NO FILE SELECTED!';
                    console.log('No file selected');
                    res.send(data);
                } else {
                    data.message = 'File Uploaded!';
                    console.log('File uploaded');
                    let fileUrl = `http://localhost:8181/api/uploads/avatars/${req.file.filename}`; // TODO CHANGE TO DOMAIN NAME WHEN HOSTING ONLINE
                    data.fileUrl = fileUrl;
                    
                    User.findByIdAndUpdate(
                        userId,
                        { 
                            $set: { avatar: fileUrl }
                        },
                        {new: true}
                    ).populate('namespaces')
                    .then((updatedUser) => {
                        console.log('updatedUser is');
                        console.log(updatedUser);

                        res.send(data);

                        // Update people details for namespaces in which user belongs
                        updatedUser.namespaces.forEach((ns) => {
                                console.log('Updating user avatar in namespace ' + ns.groupName);
                                Namespace.findById(ns.id).then((updatedNamespace) => { 
                                    // console.log('updatedNamespace is');
                                    // console.log(updatedNamespace);  
                                    let index = 0;
                                    for (index = 0; index < updatedNamespace.peopleDetails.length; index ++) {
                                        if (updatedNamespace.peopleDetails[index].email === updatedUser.email) {
                                            updatedNamespace.peopleDetails[index].avatar = updatedUser.avatar;
                                        }
                                    };

                                    updatedNamespace.save().then((savedNamespace) => {
                                        console.log('Updated user details in namespace!');
                                        console.log(savedNamespace);
                                    }).catch((err) => {
                                        console.log(err);
                                    })

                                    // console.log('Updated namespace is');
                                    // console.log(updatedNamespace);
                                }).catch((err) => {
                                    console.log(err);
                                });

                        });

                    }).catch((err) => {
                        console.log(err);
                    });
                }
            }
        });
    });
    
});



let namespaceDestination = './uploads/namespace';  // IMPORTANT Path relative to SERVER folder (not this file);

// Set The Storage Engine
const namespaceStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Expects req.endpointWithoutSlashto be set
        console.log('Destination is ' + `${namespaceDestination}/${req.endpointWithoutSlash}/`);
        cb(null, `${namespaceDestination}/${req.endpointWithoutSlash}/`);
    },
    filename: function(req, file, cb) {
        let now = Date.now();

        let fileOriginalNameWithoutSpaces = file.originalname.split(' ').join('')

        let fileName = now + "_" + fileOriginalNameWithoutSpaces;

        console.log('File name is ' + fileName);
        cb(null, fileName);
    }
});

// Init Upload for namespace files
const namespaceUpload = multer({
    storage: namespaceStorage,
    limits: {fileSize: 20971520}, // in bytes (so exactly 20 MB);
    fileFilter: function(req, file, cb){
        namespaceCheckFileType(file, cb);
    }
}).single('namespaceFile');

// Check File Type to block
function namespaceCheckFileType(file, cb){
    // Blocked extensions
    const blockedFiletypes = /exe|xml|cmd|ksh/;
    // Check ext
    const extname = blockedFiletypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = blockedFiletypes.test(file.mimetype);

    if (!mimetype && !extname) {
        return cb(null, true);
    } else {
        cb({message: 'Error: File type not allowed'});
    }
}


// Retrieve a file from namespace
router.get('/namespace/:namespace/:fileName', middleware.isLoggedIn, (req, res) => {
    let fileName = req.params.fileName;
    let userId = req.session.passport.user;

    let endpointWithoutSlash = req.params.namespace;
    console.log('\n Reached get route for namespace file with params ' + endpointWithoutSlash + ' and ' + fileName);
    
    // This case shouldn't be reached as made route parameters mandatory to reach here
    if (!fileName || !endpointWithoutSlash) {
        let data = {
            success: false
        }

        data.errorMessage = "Need to specify a valid path to file!";
        res.send(data);
        
    } else {
        
        // Check if file exists first
        fs.access(path.resolve(`./uploads/namespace/${endpointWithoutSlash}/${fileName}`), fs.F_OK, (err) => {
            if (err) {
              console.error(err);
              console.log('FILE NO EXIST');
              res.send("ERROR NO SUCH FILE");
              return;
            }
          
            // file exists, send file
            res.sendFile(path.resolve(`./uploads/namespace/${endpointWithoutSlash}/${fileName}`));	
        });
        
    }
});


// Upload files to namespace
router.post('/namespace/:namespace', middleware.isLoggedIn, (req, res) => {
    console.log('Reached post route for namespace');

    let userId = req.session.passport.user;
    let endpoint = "/" + req.params.namespace;

    let endpointWithoutSlash = req.params.namespace;

    Namespace.findOne(
        {endpoint: endpoint}
    ).then( async (foundNamespace) => {

        // Make sure user belongs to namespace
        if (foundNamespace.people.indexOf(userId) === -1) {
            console.log(userId + 'Attempted unauthorized upload to namespace ' + foundNamespace.endpoint);
            res.statusMessage = "UNAUTHORISED CREDENTIALS!";
            res.status(403);
            res.send("ERROR, UNAUTHORIZED CREDENTIALS");
            return;
        }   

        // namespaceUpload
        let data = {
            success: true
        }

        // Make namespace endpoint available in multer's setup function to determine file destination
        req.endpointWithoutSlash = endpointWithoutSlash;

        // Make directory for namespace if it doesn't exist already;
        await fs.promises.mkdir(path.resolve(`./uploads/namespace/${endpointWithoutSlash}`), { recursive: true })

        namespaceUpload(req, res, (err) => {
            if (err) {
                data.success = false;
                console.log(err);
                data.errorMessage = err.message;
                console.log('Error in upload');
                res.send(data);
            } else {
                if (req.file == undefined) {
                    data.success = false;
                    data.errorMessage = 'NO FILE SELECTED!';
                    console.log('No file selected');
                    res.send(data);
                } else {
                    data.message = 'File Uploaded!';
                    console.log('File uploaded');
                    let fileUrl = `http://localhost:8181/api/uploads/namespace/${endpointWithoutSlash}/${req.file.filename}`; // TODO CHANGE TO DOMAIN NAME WHEN HOSTING ONLINE
                    data.fileUrl = fileUrl;

                    Namespace.findByIdAndUpdate(
                        foundNamespace.id,
                        { 
                            $push: { "files": fileUrl }
                        },
                        {new: true}
                    ).then((updatedNamespace) => {
                        console.log('updatedNamespace is');
                        console.log(updatedNamespace);

                        res.send(data);

                    }).catch((err) => {
                        console.log(err);
                    });
                }
            }
        });



    }).catch((err) => {
        console.log(err);
    });


});

module.exports = router;