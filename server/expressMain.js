// var   express     = require('express'),
// 	  app         = express(),
// 	  bodyParser  = require('body-parser'),
// 	  mongoose    = require('mongoose'),
// 	  flash       = require('connect-flash'),
// 	  passport    = require('passport'),
// 	  LocalStrategy = require('passport-local'),
// 	  methodOverride = require('method-override'),
// 	  User        = require('./models/user'),
// 	  seedDB      = require('./seeds');
// // Requiring routes
// const indexRoutes = require("./routes/index");
// // PASSPORT CONFIGURATION
// app.use(require('express-session')({
// 	secret: "Super secret key mate",
// 	resave: false,
// 	saveUninitialized: false
// }));

// mongoose.connect("mongodb://localhost:27017/triton_study_room", {useNewUrlParser: true, useUnifiedTopology: true});
// app.use(bodyParser.urlencoded({extended: true}));
// app.set("view engine", "ejs");
// app.use(express.static(__dirname + "/public"));
// app.use(methodOverride("_method"));
// app.use(flash());
// app.use(helmet());

// app.use(passport.initialize());
// app.use(passport.session());
// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// app.use("/", indexRoutes);

// // App listens in server file
// // app.listen(3000, () => {
// // 	console.log("Express server has started");
// // });

// module.exports = app;