var express = require('express');
var router = express.Router();
var main = require('./routes/index');
var app = express();
var bodyParser  = require('body-parser');
var methodOverride  = require('method-override');
var validator = require('express-validator');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
/* var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(); */
var fork = require('child_process').fork;
var fs = require('fs');
var config;
var takt = 0;
var args = [takt];
var timeon = [];
var taktcount = [];
var andonlist;
var andonstate = [];
var data;

const port=process.env.PORT || 3000

/* Configure the application */
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(validator());
app.use(methodOverride());
app.use(router);
app.use(express.static(__dirname + '/'));
app.use(express.static(__dirname + '/public'));

/* initialise andon state array - element 0 will not be used to ensure the elements match up with the appropriate andon number. */
for (index = 0; index < 21; index++) {
  andonstate.push('normal');
};
/* initialise andon time array - element 0 will not be used to ensure the elements match up with the appropriate andon number. */
for (index = 0; index < 21; index++) {
  timeon[index] = process.hrtime();
};

/* Serve up the main application page  */
app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/index.html');
});

/* Setup the appropriate database connections, routes and models */
routes = require('./routes');
line = require('./models/lines');
route = require('./routes/lines');
line.connect('./db/Andondb', function(err) {
  if (err) {throw err;}
});

andonmd = require('./models/andon');
andonrt = require('./routes/andon');
andonmd.connect('./db/Andondb', function(err) {
  if (err) {throw err;}
});

[routes, route].forEach(function(router) {
  router.configure({model: line});
});

[andonrt].forEach(function(router) {
  router.configure({model: andonmd});
});

/* I have experimented with two methods of populating andon data. The first reads in a JSON file which holds the andon information. The second reads the information from
the andon table in the database. */

/* Read in the JSON file holding andon information */
data = fs.readFileSync('./config.json'),
      config;
try {
  config = JSON.parse(data);
}
catch (err) {
  console.log('There has been an error parsing your JSON.');
  console.log(err);
}

/* Use the andon route to retrieve information from the database. IMPORTANT - andonlist is not available immediately after this statement due to the asynchronous nature of the call.
It IS available where it is required - within the connection processing */
andonrt.getandons(getandons);

/* Set up the data entry routes for line and andon maintenance */
app.get('/lines', main.index);
app.get('/lineadd', route.add);
app.post('/linesave',  route.save);
app.get('/lineedit',   route.edit);
app.get('/lineview',   route.view);
app.get('/linedestroy', route.destroy);
app.post('/linedodestroy',  route.dodestroy);

app.get('/andons', andonrt.index);
app.get('/andonadd', andonrt.add);
app.post('/andonsave',  andonrt.save);
app.get('/andonedit',   andonrt.edit);
app.get('/andonview',   andonrt.view);
app.get('/andondestroy', andonrt.destroy);
app.post('/andondodestroy', andonrt.dodestroy);

/* Listen on port 3000. By not specifying an IP address the server will listen on all available. If a specific IP address is required enter it in the following format - server.listen(3000, "X.X.X.X"). Replace
Xs with the required IP address */
server.listen(port);

io.on('connect', function(socket) {
  /* Andon triggered event */
  socket.on('AndonTrigger', function(andon) {
  /* Set the state */
  andonstate[andon] = 'triggered';
  /* Save the time */
  timeon[andon] = process.hrtime();
  /* Log to console */
  console.log('Andon' + andon + 'Trigger');

  /*io.emit("SrvAndonTrigger",{number:andon,type:config.Andons[andon].Type});	 This line is commented out as it uses the array from the JSON file load. Left in for reference purposes only*/

  /* Let all clients know there is a triggered andon.  */
  io.emit('SrvAndonTrigger', {number: andon, type: andonlist[andon].type});

  /*takt = config.Andons[andon].andontaktrate - config.Andons[andon].countstart;	This line is commented out as it uses the array from the JSON file load. Left in for reference purposes only*/

  /* Calculate the takt rate of the andon. This is a customer specific takt rate calculation */
  takt = andonlist[andon].andontaktrate - andonlist[andon].countstart;
  args = [takt];
  /* Fork a new counter process with the calculated takt rate for the given andon. There could be a number of these processes running at a given time.
	 */
  taktcount[andon] = fork(__dirname + '/taktcounter.js', args);

  /* Once the counter process  has finished check its andon state. If it hasn't been cleared let clients know the andon is now in error */
  taktcount[andon].on('exit', function(code, signal) {
    if (andonstate[andon] == 'triggered') {
      /*io.emit("SrvAndonError",{number:andon,type:config.Andons[andon].Type});*/
      io.emit('SrvAndonError', {number: andon, type: andonlist[andon].type});
      andonstate[andon] = 'error';
    };

    console.log('child process has died. Exit code;', code, ', signal:',
     signal);
  });

	});

  /* Listen for clear condition on Andon  from client */
  socket.on('AndonClear', function(andon) {
    timeon[andon] = process.hrtime(timeon[andon]);
    /* Log to console */
    console.log('Andon' + andon + ' Clear. Andon was on for ' +
    timeon[andon][0] + ' seconds.');
    if (andonstate[andon] == 'error') {
    statusmsg = 'E';}else {statusmsg = 'W';
    };

    /* Send an email detailing the andon activity */

    // sendMail(andon, statusmsg);

    //reset status
    andonstate[andon] = 'normal';

    /* Let all connected clients know the trigger is clear */
    io.emit('SrvAndonClear', andon);
    /* Check the state of all andons. If all are clear let clients know*/
    if (andonerrors(andonstate) == false) {
      console.log('No errors found');
      io.emit('Srvnoandonerrors', ('noandonerrors'));
    };
  });
});

function andonerrors(andonstate) {
  /* Check the status of all andons */
  for (var i = 0; i < 21; i++) {
    if (andonstate[i] !== 'normal') {return true;}
  };

  return false;
};

// function sendMail(andon, status) {
//   number = parseInt(andon);
//   duration = parseInt(timeon[number][0]) +
//   parseInt(andonlist[number].countstart);
//   /* Subject field is defined by customer requirement */
//   subject = 'Andon' + andon + andonlist[number].Type + statusmsg +
//    andonlist[number].andontaktrate + andonlist[number].linetaktrate + duration;
//   transporter.sendMail({
//     from: 'andonsystem@markmcdonald.co.uk', /* Appropriate from address */
//     to: 'andonmonitoring@markmcdonald.co.uk',			/* Appropriate to address */
//     subject: subject,
//     text: 'appropriate text',
//   });
// };

function getandons(err, result) {
  /* Callback used to retrieve andons from the database */
  if (err) {
    // Just an example. You may want to do something with the error.
    console.error(err.stack || err.message);

    // You should return in this branch, since there is no result to use
    // later and that could cause an exception.

  }

  andonlist = result;

}
