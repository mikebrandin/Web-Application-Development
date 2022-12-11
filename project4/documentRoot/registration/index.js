//labels for the strength meter, stored in an array so we can do
//something like label = strengthLabels[zxcvbnResults.score]
const strengthLabels = [
	"Very Weak",
	"Weak",
	"Fair",
	"Strong",
	"Very Strong"
];

//standardized error messages, same code as in server.js for consistency!
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

//shows or hides error box using CSS Styles
//sets message inside the box
const showError = (msg) =>{
	const errorNode = document.getElementById("error");
	if(msg == "" || msg == false){
		//hide error
		errorNode.style = "visibility: hidden;";
		return;
	}
	errorNode.innerText = msg;
	errorNode.style = "";
};

//validates data before wasting ths user's and server's time
//this is NOT security, this is convience 
//we will have to do the same checks on the server
const validate = () =>{
	//get values from the elements username, password, confirm_password and name
	//do validation to make sure 
	//	each is not empty
	//	that username is not > 25, password and name are not > 100
	//	password matches confirm_password
	//	and password is at least scoring a 2 or higher from zxcvbn
	//if any validation fails, use showError and the correct errorMessages key and return false
	//otherwise showError(false) to clear errors and return true

	//TODO complete the above
	const uidNode = document.getElementById("username")
	const username = uidNode.value

	const pwdNode = document.getElementById("password")
	const password = pwdNode.value

	const pwdconfirmNode = document.getElementById("confirm_password")
	const password_confirm = pwdconfirmNode.value

	const nameNode = document.getElementById("name")
	const name = nameNode.value

	if (username == ""){
		showError(errorMessages["NO_USER"])
		return false
	}
	else if (password == ""){
		showError(errorMessages["NO_PASSWORD"])
		return false
	}
	else if (name == ""){
		showError(errorMessages["NO_NAME"])
		return false
	}
	else if (password_confirm == ""){
		showError(errorMessages["NO_CONFIRM_MATCH"])
		return false
	}
	else if (username.length > 25){
		showError(errorMessages["USER_TOO_LONG"])
		return false
	}
	else if (password.length > 100){
		showError(errorMessages["PASSWORD_TOO_LONG"])
		return false
	}
	else if (name.length > 100){
		showError(errorMessages["NAME_TOO_LONG"])
		return false
	}
	else if (zxcvbn(password).score < 2){
		showError(errorMessages["PASSWORD_TOO_WEAK"])
		return false
	}
	else if (password != password_confirm){
		showError(errorMessages["PASSWORD_NOT_MATCH"])
		return false
	}
	else{
		showError(false)
		return true
	}

};

//callback for form submission, runs validation and stops form submission on error
const onSubmit = (e) =>{
	//if validate doesn't return true stop form submission
	if(!validate()){
		e.preventDefault();
		return false;
	}

	const buttonNode = document.getElementById("submit");
	buttonNode.innerText = "Submitting, please wait...";

	return true;
};

//sets the username status icon to thumbs up or down
const setUsernameStatus = (exists)=>{
	if(exists){
		document.getElementById("usernameStatus").innerHTML = "thumb_down";
	}else{
		document.getElementById("usernameStatus").innerHTML = "thumb_up";
	}
}

//sets the password strength meter color, size and label based on score
const setScore = (score) => {
	const meter = document.querySelector('#passwordmeter span');
	const msg = document.getElementById('passwordmessage');

	meter.style.width = (score+1) * 25 + 'px';

	//Set the color of the meter to
	// a) red if the score < 3
	// b) yellow if the score = 3
	// c) green if the score = 4
	//Change the text of the password message element accordingly.
	if(score < 2){
		meter.style.backgroundColor = 'red';
	}else if (score < 3){
		meter.style.backgroundColor = 'yellow';
	}else{
		meter.style.backgroundColor = 'green';
	}

	msg.innerHTML = '<strong>'+strengthLabels[score]+'</strong> Password';		
}

//callback for username change, talks to server to see if username exists
//uses setUsernameStatus to change the icon based on result from server
const onUsernameChange = function(){
	//get the value of the username field and use axios to send a request to
	//'../dynamic/user/exists?userid='+value
	//use the response data exists key to call setUsernameStatus
	
	//TODO: complete the above
	const user_value = document.getElementById("username").value;

	axios.get('../dynamic/user/exists?userid='+user_value)
		.then((result) => {
			setUsernameStatus(result.data.exists)
		});

}

//callback for password change, tests password against zxcvbn libs and
//uses setScore to display strength
const onPasswordChange = function(){
	//get the value of the password field and use zxcvbn to determine the score
	//call setScore with the score returned from zxcvbn
	
	//TODO: complete the above
	const pass_value = document.getElementById("password").value	
	setScore(zxcvbn(pass_value).score)
}

//sets up callbacks on form, password field and username field
//displays any errors from server that we received as we landed on the page
//and then clears out that error field (the hash part of the URL) 
//so that subsequent refreshes don't continue to display the error
const init = () => {
	const formNode = document.getElementById("form");
	formNode.onsubmit = onSubmit;
	
	const usernameNode = document.getElementById("username");
	usernameNode.onkeyup = onUsernameChange;
	usernameNode.onpaste = onUsernameChange;
	
	const passwordNode = document.getElementById("password");
	passwordNode.onkeyup = onPasswordChange;
	passwordNode.onpaste = onPasswordChange;

	let errorMessage = window.location.hash;
	window.location.hash = ""

	if (errorMessage){
		errorMessage = decodeURIComponent(errorMessage).slice(1);
		showError(errorMessage);
	}
};

window.addEventListener("load",init,false);