/* 
Project: BME/CSE Wearable Sensor: Stresswatch
  File: index.js
  Team Members: Megan Lu, Kristen Park, Kanita Sivananthan, Lily Wang
  Team Member Responsible for Page: Kanita Sivananthan
  Date: 6/5/2021

  Task Description: JavaScript for the home and faq pages.
    - Materialize code for the Modals.
    - Sets up toggled buttons/pages.
    - Allows for sticky nav bar.
*/

//Setup Materialize Modals
document.addEventListener('DOMContentLoaded', function() {

  var modals = document.querySelectorAll('.modal');
  M.Modal.init(modals);
});

//Set up toggled display for navs depending on signing in
const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');

const setupUI = (user) => {     //when the user logs in or out, the visable elements will change
  if (user){
    //toggle UI elements for when the user is logged in
    loggedInLinks.forEach(item => item.style.display = 'block');
    loggedOutLinks.forEach(item => item.style.display = 'none');
  }
  else{
    //toggle UI elements for when the user is logged out
    loggedInLinks.forEach(item => item.style.display = 'none');
    loggedOutLinks.forEach(item => item.style.display = 'block');
  }
}

//Set up sticky nav bar
window.onscroll = function() {myFunction()};
var navbar = document.getElementById("bottom-bar");
var sticky = navbar.offsetTop;

function myFunction(){
  if (window.pageYOffset >= sticky){
    navbar.classList.add("sticky");
  }
  else{
    navbar.classList.remove("sticky");
  }
}