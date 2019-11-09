// entrypoint for our cluster which will make workers
// and the workers will do the Socket.io handling

//See https://github.com/elad/node-cluster-socket.io

// Express requires
const  express     = require('express'),
	   bodyParser  = require('body-parser'),
	   mongoose    = require('mongoose'),
	   flash       = require('connect-flash'),
	   cors        = require('cors'),
	   passport    = require('passport'),
	//    LocalStrategy = require('passport-local'),
	   sharedSession = require("express-socket.io-session"),
	   methodOverride = require('method-override'),
	   keys        = require('./config/keys'),
	   User        = require('./models/User');

// Requiring routes
const indexRoutes     = require("./routes/index"),
	  authRoutes      = require('./routes/auth-routes'),
	  namespaceRoutes = require('./routes/namespace-routes');

const cluster = require('cluster');
const net = require('net');
const socketio = require('socket.io');
const helmet = require('helmet')
const socketMain = require('./socketMain');
// const expressMain = require('./expressMain');

const port = 8181;
const num_processes = require('os').cpus().length;
// installed redis from https://redis.io/topics/quickstart
// have to actually run redis via: $ redis-server (go to location of the binary)
// check to see if it's running -- redis-cli monitor
const io_redis = require('socket.io-redis');
const farmhash = require('farmhash');

if (cluster.isMaster) {
	// This stores our workers. We need to keep them to be able to reference
	// them based on source IP address. It's also useful for auto-restart,
	// for example.
	let workers = [];

	// Helper function for spawning worker at index 'i'.
	let spawn = function(i) {
		workers[i] = cluster.fork();

		// Optional: Restart worker on exit (if worker die, spawn it again)
		workers[i].on('exit', function(code, signal) {
			// console.log('respawning worker', i);
			spawn(i);
		});
    };

    // Spawn workers.
	for (var i = 0; i < num_processes; i++) {
		spawn(i);
	}

	// Helper function for getting a worker index based on IP address.
	// This is a hot path so it should be really fast. The way it works
	// is by converting the IP address to a number by removing non numeric
    // characters, then compressing it to the number of slots we have.
	//
	// Compared against "real" hashing (from the sticky-session code) and
	// "real" IP number conversion, this function is on par in terms of
	// worker index distribution only much faster.
	const worker_index = function(ip, len) {
		return farmhash.fingerprint32(ip) % len; // Farmhash is the fastest and works with IPv6, too
	};


    // in this case, we are going to start up a tcp connection via the net
    // module INSTEAD OF the http module. Express will use http, but we need
    // an independent tcp port open for cluster to work. This is the port that 
    // will face the internet
	const server = net.createServer({ pauseOnConnect: true }, (connection) =>{
		// We received a connection and need to pass it to the appropriate
		// worker. Get the worker for this connection's source IP and pass
		// it the connection.
		let worker = workers[worker_index(connection.remoteAddress, num_processes)];
		worker.send('sticky-session:connection', connection);  // Make sure get to the right worker
    });
    server.listen(port);
    console.log(`Master listening on port ${port}`);
} else {
	// Note we don't use a port here because the master listens on it for us.
	
	var app = new express();

	mongoose.connect(keys.mongoDB.connectionURI, {useNewUrlParser: true, useUnifiedTopology: true});
	app.use(bodyParser.json()); // handle json data, needed for axios requests to put things in req.body
	app.use(bodyParser.urlencoded({extended: true}));
	app.set("view engine", "ejs");
	app.use(express.static(__dirname + "/public"));
	app.use(methodOverride("_method"));
	app.use(flash());
	app.use(helmet());


	// PASSPORT/SESSION CONFIGURATION
	const expressSession = require('express-session');
	const MongoStore = require('connect-mongo')(expressSession);

	session = expressSession({
		store: new MongoStore({
			url: keys.mongoDB.connectionURI
		}),
		secret: keys.session.secret,
		resave: false,
		saveUninitialized: false,
		cookie: { 
			maxAge: 24 * 60 * 60 * 1000 // in ms => 1 day
			// maxAge: 10000 // in ms => 10 secs for testing
		} 
	});
	app.use(session);

	// PASSPORT CONFIG
	app.use(passport.initialize());
	// passport.session() acts as a middleware to alter the req object and change 
	// the encrypted user value that is currently the session sig (from the client cookie) into a user object.
	app.use(passport.session());

	// // No longer need local strategy
	// passport.use(new LocalStrategy(User.authenticate()));
	// passport.serializeUser(User.serializeUser());
	// passport.deserializeUser(User.deserializeUser());

	// Adds middleware to all routes. May not be needed if not serving ejs/template files from server
	app.use((req, res, next) => {
		// Anything in res.locals are available in our template ejs files
		// req.user is created by passport (only non-empty if user is logged in)
		res.locals.currentUser = req.user;
		res.locals.error = req.flash("error");
		res.locals.success = req.flash("success");
		next(); // Continue after middleware, needed for custom middleware functions
	});

	// // Use this or below
	// app.use(cors({
	// 	origin: 'http://localhost:3000',
	// 	credentials: true,
	// }));

	// Adds middleware to allow react to make XMLHttpRequest with credentials.
	app.use(function(req, res, next) {
		// Allow react to make XMLHttpRequest with credentials. NOTE: port 3000 is react client port
		var allowedOrigins = [`http://127.0.0.1:${port}`, `http://localhost:${port}`,  'http://localhost:3000'];
		var origin = req.headers.origin;
		// Check which origin request is comming from, and if one of allowed, add header to allow itt
		if (allowedOrigins.indexOf(origin) > -1) {
			res.setHeader('Access-Control-Allow-Origin', origin);
		}
		  
		// res.header('Access-Control-Allow-Origin', 'http://localhost:3000');  
		res.header('Access-Control-Allow-Credentials', true);
		res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-PINGOTHER');
		next();
	});


	// Adds middleware to all routes to make io server available
	app.use((req,res,next) => {
		req.io = io;
		next();
	});

	// // Let express serve static assets only in production
	// if (process.env.NODE_ENV === "production") {
	// 	app.use(express.static("client/build"));  // Todo move client to same folder. Won't have to worry about CORS
	// }

	app.use("/api", indexRoutes);
	app.use("/api/auth", authRoutes);
	app.use("/api/namespace", namespaceRoutes);

	// Don't expose our internal server to the outside world. Hence port 0.
	// Remember master listensFor outside world
	const server = app.listen(0, 'localhost');
	
    // console.log("Worker listening...");    
	const io = socketio(server);

	// Tell Socket.IO to use the redis adapter. By default, the redis
	// server is assumed to be on localhost:6379. You don't have to
	// specify them explicitly unless you want to change them.
	// redis-cli monitor
	io.adapter(io_redis({ host: 'localhost', port: 6379 }));

	// Here you might use Socket.IO middleware for authorization etc.
	// on connection, send the socket over to our module with socket stuff
	
	// io.use((socket, next) => {
	// 	var handshakeData = socket.request;
	// 	// Possibly check passport session here (req.session.passport)
	// 	if (handshakeData.isAuthenticated()) {
	// 		console.log(req.user);
	// 		next();
	// 	} else {
	// 		console.log('Error');
	// 	}

	// 	// console.log('socket middleware excuting');
	// 	// sessionMiddleware(handshakeData, {}, next);

	// 	// make sure the handshake data looks good
	// 	// if error
	// 	  // next(new Error('not authorized'));
	// 	// else call next
	// 	// next();

	// });

	// "session" parameter is express session
	io.use(sharedSession(session));

	// Listen to socket io client side connections to root namespace
    io.on('connection', function(socket) {
		
		console.log(`connected to worker: ${cluster.worker.id}`);

		// var userId = socket.request.session.passport.user;
		// console.log("User id is", userId);
		
		socketMain(io,socket);
    });

	// Listen to messages sent from the master. Ignore everything else.
	process.on('message', function(message, connection) {
		// If not message by server for stickey connection, ignore
		if (message !== 'sticky-session:connection') {
			return;
		}

		// Emulate a connection event on the server by emitting the
		// event with the connection the master sent us. 
		// So the server listening to port 0 is connected
		server.emit('connection', connection);

		// Remember we did pauseOnConnect: true
		connection.resume();
	});
}
