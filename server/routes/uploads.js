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

// Init Upload
const avatarUpload = multer({
    storage: avatarStorage,
    limits: {fileSize: 1024000}, // in bytes (so 1 MB);
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
        cb('Error: Images Only (jpeg, jpg, png)!');
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

        fs.access(path.resolve(`./uploads/avatars/${fileName}`), fs.F_OK, (err) => {
            if (err) {
              console.error(err);
              console.log('FILE NO EXIST');
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
                data.errorMessage = err;
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

module.exports = router;