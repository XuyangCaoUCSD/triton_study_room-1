const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const middleware = require('../middleware/index');

const router = express.Router();

const User = require('../models/User');
const Namespace = require('../models/Namespace');
const { File } = require('../models/File');

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
                                    let foundIndex = -1
                                    let peopleDetails = updatedNamespace.peopleDetails;
                                    for (index = 0; index < peopleDetails.length; index ++) {
                                        if (peopleDetails[index].email === updatedUser.email) {
                                            foundIndex = index;
                                            Namespace.updateOne(
                                                {"_id": updatedNamespace.id, "peopleDetails.email": updatedUser.email},
                                                {"$set": {"peopleDetails.$.avatar": updatedUser.avatar} }
                                            ).then((doc) => {
                                                console.log('Updated user avatar in namespace!');
                                                console.log(doc);
                                            }).catch((err) => {
                                                console.log(err);
                                            });
                                            return;
                                        }
                                    };

                                    if (foundIndex === -1) {
                                        console.log('Error, could not find user info to remove from namespace');
                                        return;
                                    }

                                
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
    const blockedFiletypes = /exe|cmd|ksh/;
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

//  Get all files messages belonging to namespace from database (not file server)
router.get('/namespace/:namespace', middleware.isLoggedIn, (req, res) => {
    
    console.log('Reached files get route');

    let userId = req.session.passport.user;
    let endpoint = "/" + req.params.namespace;

    let data = {
        success: true
    }

    Namespace.findOne({
        endpoint: endpoint
    }).select('people files')
    .then((foundNamespace) => {

        // Serverside authorisation check (if user has permission for group) (in case somehow user has access to link)
        if (foundNamespace.people.indexOf(userId) === -1) {
            console.log('Attempted unauthorized access');
            res.statusMessage = "UNAUTHORISED CREDENTIALS!";
            res.status(403);
            res.send("ERROR, UNAUTHORIZED CREDENTIALS");
            return;
        }

        console.log('Getting files from ' + endpoint);
        File.findById(foundNamespace.files).then((foundFileObj) => {
            // No need to expose file id
            data.files = foundFileObj.files.map((file) => {
                return {
                    originalName: file.originalName,
                    url: file.url
                }
            });
            res.send(data);
        }).catch((err) => {
            console.log(err);
        })
        
    })
    
});

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

                    console.log('file originalname is');
                    console.log(req.file.originalname);

                    let newFileEntry = {
                        originalName: req.file.originalname, // name on the right is lower case
                        url: fileUrl
                    }

                    // If file object doesn't exist, create new, else update existing
                    if (!foundNamespace.files) {
                        File.create({
                            files: [newFileEntry],
                            forNamespace: foundNamespace.endpoint
                        }).then((createdFileObject) => {
                            console.log('Created new file object for ns')

                            Namespace.findByIdAndUpdate(
                                foundNamespace.id,
                                {$set: {files: createdFileObject.id}},
                                {new: true}
                            ).then((updatedNamespace) => {
                                console.log('Saved new file object to ns');
                                
                                res.send(data);
                            }).catch((err) => {
                                console.log(err);
                            })
                            
                        }).catch((err) => {
                            console.log(err);
                        })
                    } else {
                        File.findByIdAndUpdate(
                            foundNamespace.files, // files field should be an id
                            { 
                                $push: { "files": newFileEntry }
                            },
                            {new: true} // Upsert true to create one if not already existing
                        ).then((updatedFileObj) => {
                            console.log('updatedFileObj is');
                            console.log(updatedFileObj);
    
                            res.send(data);
    
                        }).catch((err) => {
                            console.log(err);
                        });
                    }
                    
                }
            }
        });



    }).catch((err) => {
        console.log(err);
    });


});

module.exports = router;