// Bring in the room class
const Namespace =  require('../classes/Namespace');
const Room =  require('../classes/Room');

// Set up the namespaces
let namespaces = [];
let cse110Ns = new Namespace(0,'cse110','https://i.ytimg.com/vi/O753uuutqH8/maxresdefault.jpg','/cse110');
let cse100Ns = new Namespace(1,'cse100','https://cecieee.org/wp-content/uploads/2018/11/data-structure.jpg','/cse100');
let cse101Ns = new Namespace(2,'cse101','https://i.ytimg.com/vi/rL8X2mlNHPM/maxresdefault.jpg','/cse101');

// Make the main room and add it to rooms. it will ALWAYS be 0
cse110Ns.addRoom(new Room(0,'General','cse110'));
cse110Ns.addRoom(new Room(1,'Labs','cse110'));
cse110Ns.addRoom(new Room(2,'Other','cse110'));

cse100Ns.addRoom(new Room(0,'General','cse100'));
cse100Ns.addRoom(new Room(1,'Programming Assignments','cse100'));
cse100Ns.addRoom(new Room(2,'Other','cse100'));

cse101Ns.addRoom(new Room(0,'General','cse101'));
cse101Ns.addRoom(new Room(1,'Homework','cse101'));
cse101Ns.addRoom(new Room(2,'Other','cse101'));

namespaces.push(cse110Ns,cse100Ns,cse101Ns);

module.exports = namespaces;