/* 
Project: BME/CSE Wearable Sensor: Stresswatch
  File: firebase.js
  Team Members: Megan Lu, Kristen Park, Kanita Sivananthan, Lily Wang
  Team Member Responsible for Page: Kanita Sivananthan
  Date: 6/5/2021

  Task Description: JavaScript for Firebase for the home page (index.html)
    - Initializes the Firebase.
    - Create variables for referencing.
*/

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