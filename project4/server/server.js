//load some core nodejs libraries
const fs = require('fs');
const crypto = require('crypto');

//load some npm installed libraries
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const e = require('express');

//load some variables from the environment (npm start in package.json)
const port = process.env.NODE_PORT || 3000;
const proxy_path = process.env.PROXY_PATH ||"";

//define the filepath for the database (json) file
const dbPath = 'db/store.json';

//hardcoded admin user object to allow some testing and authenticated db flush
const adminObj = {
	username: "admin", 
	name: "Adam In", 
	salt: "1600864470157", 
	passwordHash: "ytM5M57DmtWUnVNydnHSDtzRA+TiOX2ypAeJF6I3Tqk="
}

//standardized error messages, same code as in registration/index.js for consistency!
//also, the postman tests look for these exact strings often...
const errorMessages = {
	"NO_USER": "You must supply a username",
	"NO_PASSWORD": "You must supply a password",
	"NO_NAME": "You must supply a name",
	"NO_CONFIRM_MATCH": "The new password and confirm password fields must match",
	"USER_TOO_LONG": "Your username cannot be longer than 25 characters",
	"PASSWORD_TOO_LONG": "Your password cannot be longer than 100 characters",
	"NAME_TOO_LONG": "Name cannot be longer than 100 characters",
	"PASSWORD_TOO_WEAK": "You must have a password strength of fair or better",
	"USER_NOT_FOUND": "User not found",
	"PASSWORD_NOT_MATCH":"Password did not match",
	"USER_EXISTS":"Username already exists",
	"REGISTRATION_SUCCESS":"Registration sucessful, please log in",
	"LOGIN_REQUIRED":"You must login to continue"
};

//init our app engine
const app = express();

//attach the bodyparser middleware to the app
app.use(bodyParser.urlencoded({ extended: true }));

//configure and attack the session manager middleware to the app
const seshConfig = {
	secret: 'some random stuff here',
	cookie: {}
}
app.use(session(seshConfig))

//get a userobj from the db file 
const getUser = (userid)=>{
	//short circuit for admin user
	//we never store the admin user in the db
	//its just a hard coded bypass in our code now
	if(userid === 'admin'){
		return adminObj;
	}
	try {
		let db;
		if(!fs.existsSync(dbPath)){
			return false;
		}

		const data = fs.readFileSync(dbPath, 'utf8');
		db = JSON.parse(data);
		if(!db[userid]){
			console.log(`getUser ${userid} doesn't exist in db`);
			return false;
		}
		return db[userid];
	} catch (err) {
		console.error(err);
		return false;
	}
}

//saves a user to the db file
const saveUser = (userObj) => {
	try {
		let db;
		//if no file on disk create blank db object
		if(!fs.existsSync(dbPath)){
			db = {};
		}else{
			//else load current db from disk
			const data = fs.readFileSync(dbPath, 'utf8');
			db = JSON.parse(data);
		}
		//add new user to db
		db[userObj.userid] = userObj;

		//save db to disk
		fs.writeFileSync(dbPath, JSON.stringify(db));
		return true;
	} catch (err) {
		console.error(err);
		return false;
	}
}

//writes an empty db to disk
//mainly useful for automated postman testing consistency
const clearUsers= () => {
	try {
		let db = {};
		
		fs.writeFileSync(dbPath, JSON.stringify(db));
		return true;
	} catch (err) {
		console.error(err);
		return false;
	}
}

//given a password and salt 
//uses crypto libraries returns a sha256 hash of password+salt base64 encoded
const computeHash = (password, salt)=>{
	//TODO write the crypto calls and return the passwordHash
	return crypto.createHash('sha256').update(password+salt).digest('base64')
}

//endpoint to clean out db
//mainly useful for automated postman testing consistency
//requires authentication
app.delete('/db',(req,res)=>{
	//get userid and password from request body
	//validate userid and password exist and arent empty strings
	//	otherwise return 401 unauthorized, no need to send error messages here 
	//    its not used by real users or browsers
	//if username / salt / pass match something in userobj call clearusers and return a 200
	const {userid, password} = req.body;
	if(!userid||userid == ""){
		res.sendStatus(401);
		return;
	}
	if(!password||password == ""){
		res.sendStatus(401);
		return;
	}
	const userObj = getUser(userid);

	if(!userObj){
		res.sendStatus(401);
		return;
	}
	const passwordHash = computeHash(password, userObj.salt);
	if(userObj.passwordHash != passwordHash){
		res.sendStatus(401);
		return;
	}

	clearUsers();
	res.sendStatus(200);
})

//endpoint to authenticate users
//should redirect back to login with error if anything goes wrong
//should redirect to /dynamic/user/info on success
app.post('/user/auth', (req, res) => {
	//get userid and password from request body
	//validate that username and password exist and aren't empty strings
	//  return appropriate error message to login
	//validate getUser returns a user for given userid
	//  return appropriate error message to login
	//validate hashed given password using salt from getUser object matches passwordHash on getUser obj
	//  return appropriate error message to login
	//if all thats good save the userid into the request session and send user to /dynamic/user/info

	const {userid, password} = req.body;
	if(!userid || userid == ""){
		res.redirect(`${proxy_path}/login/#${encodeURIComponent(errorMessages.NO_USER)}`);
		return;
	}
	//TODO: here's an example of how to redirect correctly for missing userid.  
	//	fill out the other validations, if passes, set userid to session and redirect 
	else if(!password || password == ""){
		res.redirect(`${proxy_path}/login/#${encodeURIComponent(errorMessages.NO_PASSWORD)}`);
		return;
	}
	
	const temp_user = getUser(userid); 

	if(!temp_user){
		res.redirect(`${proxy_path}/login/#${encodeURIComponent(errorMessages.USER_NOT_FOUND)}`);
		return;
	}
	if (computeHash(password, temp_user.salt) != temp_user.passwordHash){
		res.redirect(`${proxy_path}/login/#${encodeURIComponent(errorMessages.PASSWORD_NOT_MATCH)}`);
		return;
	}
	
	req.session.userid = userid
	res.redirect(`${proxy_path}/dynamic/user/info`);
	
})

//checks whether given userid in query params exists in db
//returns a json string of either {exists:true} or {exists:false} based on results
app.get('/user/exists',(req,res)=>{
	//get userid from request query
	//validate userid exists and is not empty
	//  return json exists false if empty or doesnt exist
	//return the value of getUser in the json exists object

	//TODO complete the function
	if (getUser(req.query.userid)){
		return res.json({exists:true})
	}
	else{
		return res.json({exists:false})
	}

})

app.post('/user', (req, res) => {
	//get userid, password and name from request body
	//validate that userid, password and name exist and aren't empty strings
	//validate lengths
	//  userid can't be > 25 
	//  password can't be > 100
	//  name can't be > 100
	//validate userid doesn't already exist in getUser
	//on any error redirect to registration page with appropriate error message
	//otherwise...
	//generate a salt using current timestamp
	//generate passwordHash using salt and password
	//create user object containing userid, name, salt and passwordHash
	//  DO NOT SAVE PASSWORD IN USER OBJECT
	//save user object
	//redirect user to login page witn REGISTRATION_SUCCESS message
	const {userid, password, name} = req.body;
	if(!userid || userid == ""){
		res.redirect(`${proxy_path}/registration/#${encodeURIComponent(errorMessages.NO_USER)}`);
		return;
	}
	//TODO complete the function
	if(!password || password == ""){
		res.redirect(`${proxy_path}/registration/#${encodeURIComponent(errorMessages.NO_PASSWORD)}`);
		return; 
	}
	else if(!name || name == ""){
		res.redirect(`${proxy_path}/registration/#${encodeURIComponent(errorMessages.NO_NAME)}`);
		return; 
	}
	else if(userid.length > 25){
		res.redirect(`${proxy_path}/registration/#${encodeURIComponent(errorMessages.USER_TOO_LONG)}`);
		return; 
	}
	else if(password.length > 100){
		res.redirect(`${proxy_path}/registration/#${encodeURIComponent(errorMessages.PASSWORD_TOO_LONG)}`);
		return; 
	}
	else if(name.length > 100){
		res.redirect(`${proxy_path}/registration/#${encodeURIComponent(errorMessages.NAME_TOO_LONG)}`);
		return; 
	}
	else if(getUser(userid)){
		res.redirect(`${proxy_path}/registration/#${encodeURIComponent(errorMessages.USER_EXISTS)}`);
		return;
	}
	const salt = new Date().toString()
	const hash = computeHash(password, salt)
	
	const userObj = {userid: userid, name: name, salt: salt, passwordHash: hash}
	saveUser(userObj) 
	
	res.redirect(`${proxy_path}/login/#${encodeURIComponent(errorMessages.REGISTRATION_SUCCESS)}`)
	return

})

//displays a custom generated html page containg info about the user
//  username and name
//pulls userid from session variable
//send user to login with LOGIN_REQUIRED message if session doesn't exist
app.get('/user/info', (req, res) => {
	if(!req.session || !req.session.userid){
		res.redirect(`${proxy_path}/login/#${encodeURIComponent(errorMessages.LOGIN_REQUIRED)}`);
		return;
	}
	const userid = req.session.userid;
	const name = getUser(userid).name;
	res.send(
`<html>
	<head>
		<title>My User</title>
	</head>
	<body>
		<h1>My User</h1>
		<div><ul>
			<li>Username: ${userid}</li>
			<li>Name: ${name}</li>
		</ul></div>
	</body>
</html>`
	)
})

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})