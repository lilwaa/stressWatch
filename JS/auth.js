/* 
Project: BME/CSE Wearable Sensor: Stresswatch
  File: auth.js
  Team Members: Megan Lu, Kristen Park, Kanita Sivananthan, Lily Wang
  Team Member Responsible for Page: Kanita Sivananthan, Lily Wang
  Date: 6/6/2021

  Task Description: JavaScript for Firebase authentication and Modal filling for the home page (index.html)
    - Initializes the Firebase.
    - Create variables for referencing.
    - Tracks if the user is logged in or out in the console.
    - JS for the sign up Modal.
    - JS for the log out Modal.
    - JS for the log in Modal.
*/

//Stuff from firebase.js copied here to test something

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBirS8JnZaEvH81l-OxPWTqswKr_nrcKnc",
    authDomain: "bme-cse-sensor.firebaseapp.com",
    databaseURL: "https://bme-cse-sensor-default-rtdb.firebaseio.com/",
    projectId: "bme-cse-sensor",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

//Make auth and database references
const auth = firebase.auth();
const db = firebase.database();

//get URL
var myURL = window.location.href;  
var index = myURL.indexOf("username=");

//Listen for auth status changes
auth.onAuthStateChanged(user => {
    if (user){
        setupUI(user)
        console.log("User has logged in: ", user);
        var leadsRef = db.ref('users/').on('value', function(snapshot){
            snapshot.forEach(function(childSnapshot){
                userPerson = childSnapshot.val();

                if (user.email == userPerson["email"]){
                    console.log(userPerson["username"]);
                    user_username = userPerson["username"];
                }
            })
        })
    }
    else{
        setupUI()
        console.log("User has logged out: ", user);
    }
})

//Sign Up
const signupForm = document.querySelector('#signup-form');
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    //get user info
    const email = signupForm['signup-email'].value;
    const userName = signupForm['signup-uName'].value;
    const firstName = signupForm['signup-fName'].value;
    const lastName = signupForm['signup-lName'].value;
    const password = signupForm['signup-password'].value;

    console.log(email, password);
    
    //check if username already exists
    db.ref().child("users").orderByChild("username").equalTo(userName).once("value", snapshot =>{
        //if the username exists, print an error message
        if (snapshot.exists()){
            //delete any previous error messages that may be on the modal
            if($("#temp")){
                $("#temp").remove();
            }
            const userData = snapshot.val();

            console.log("Username already exists: ", userData);
            //print the error message to the modal
            $("#modal-signup").append("<p id='temp' class='center'>Username already exists.</p>")
        }
        //if the username does not exist, successfully authenticate the user
        else{
            //delete any previous error messages that may be on the modal
            $("#temp").remove();

            //sign up user
            auth.createUserWithEmailAndPassword(email, password).then(cred => {
                const modal = document.querySelector('#modal-signup');
                M.Modal.getInstance(modal).close();
                signupForm.reset();

                var uid = cred.user.uid;
          
                //bypass the '.' problem
                var temp = email.substring(email.indexOf('@')+1)
                temp = temp.substring(0, temp.indexOf('.'));
                const newemail = email.substring(0, email.indexOf('@')+1) + temp;

                //save information to the real time database
                db.ref("users/"+newemail).set({
                    f_name: firstName,
                    l_name: lastName,
                    email: email,
                    username: userName,
                });
            });
        }
    });
})

//Log Out
const logout = document.querySelector('#logout');
logout.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut();
    window.location.href = 'index.html';
})

//Log In
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    //get user info
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;

    auth.signInWithEmailAndPassword(email, password).then(cred => {
        //close login modal and reset form
        const modal = document.querySelector('#modal-login');
        M.Modal.getInstance(modal).close();
        loginForm.reset();

        //delete any previous error messages that may be on the modal
        $("#temp").remove();
    }).catch(err => {
        //delete any previous error messages that may be on the modal
        if($("#temp")){
            $("#temp").remove();
        }

        $("#modal-login").append("<p id='temp' class='center'>Email or password is incorrect.</p>")
    })
})

//Should only run if user is signed in
function switchpage(){
    window.location.href = 'GSR.html?username='+user_username;
}