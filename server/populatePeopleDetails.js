const mongoose = require('mongoose');
const Namespace = require('./models/Namespace');
const User = require('./models/User');
mongoose.connect("mongodb://localhost:27017/triton_study_room", {useNewUrlParser: true, useUnifiedTopology: true});

let namespacesToPopulate = [ '/cse110', '/cse100', '/cse101' ]; // TODO uncomment cse 110


namespacesToPopulate.forEach((namespaceEndpoint) => {
    Namespace.findOne({
        endpoint: namespaceEndpoint
    }).populate('people').exec()
    .then((foundNamespace) => {
        if (!foundNamespace) {
            console.log('Namespace doesnt exist, returning');
            return;
        }
        console.log('foundNamespace is');
        console.log(foundNamespace);
        let peopleDetails = foundNamespace.people.map((person) => {
            return {
                email: person.email,
                avatar: person.avatar,
                name: person.name,
                givenName: person.givenName
            }
        });

        console.log('peopleDetails is ' + peopleDetails);

        Namespace.findByIdAndUpdate(
            foundNamespace.id,
            { 
                $set: { peopleDetails: peopleDetails }
            },
            {safe: true, upsert: true, new: true}
        ).then((updatedNamespace) => {
            console.log('Updated namespace is');
            console.log(updatedNamespace);
        }).catch((err) => {
            console.log(err);
        })
    }).catch((err) => {
        console.log(err);
    });
});