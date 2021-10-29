/*-------------------------------------------------------------------------------------------------------------------
Project: StressWatch (BME/CSE Wearable Sensor) 
File: GSR.js
Team Members: Megan Lu, Kristen Park, Kanita Sivananthan, Lily Wang
Team Member Responsible for Page: Lily Wang
Date: 6/4/2021

Task Description: Sensor's Page Functions
   - Connect JS library to Arduino BLE via Bluetooth
   - Store and retrieve data from JS into Firebase
   - Create charts to visualize data and analyze changes
--------------------------------------------------------------------------------------------------------------------------*/
/*----- Define Variables -----*/
var startDate = "2021-01-01";                                                   // Start Date for calendar (default)

/*Retrieve username from URL*/
var myURL = window.location.href;                                               // String URL of page                                           
var uIndex = myURL.indexOf("username=");                                        // Index of username in URL
var userName = myURL.slice(uIndex + 9, myURL.length);                           // Variable for username
document.getElementById('welcomeName').innerHTML=userName;                      // Display username on HTML

/* Arrays to store data retrieved from Firebase*/
var dateKeys=[];                                                                // Dates of measurement, number of measurements on that day
var timeKeys=[];                                                                // Time stamps of measurements
var values=[];                                                                  // Sensor values (calculated in ohms)

/*-------------------------------------------------------------------------------------------------------------------------

Bluetooth: Arduino --> p5ble library --> Firebase

---------------------------------------------------------------------------------------------------------------------------*/
const serviceUuid = "19b10010-e8f2-537e-4f6c-d104768a1214";                     // serviceUUID
const characteristicUuid = "19b10011-e8f2-537e-4f6c-d104768a1214";              // characteristic UUID
let myCharacteristic;
let myBLE;
let database;

let myStatus = "Not connected";                                                 // Sensor Status: Tracks state through measurement
let dataString = "";                                                            // Raw data String
let date;                                                                       // Date Stamp                                                       
let time;                                                                       // Time Stamp

/* Progress Bar function */
var percent = 0;                                                                // Initial Progress Bar state
function move(steps) {
    if (percent + steps < 90){                                                  // Maximum progress by data: 90%
        percent += steps;
    }
    else if (steps == 200){                                                     // Complete progress when data is stored in Firebase
        var left = 100 - percent;
        percent += left;
    }
    else if (steps == 300){                                                     // Clear progress when notification ends
        percent -= (percent);
    }
    document.getElementById("myBar").style.width = percent + "%";
}

/* Start Notification function */
function connectAndStartNotify() { 
    myBLE.connect(serviceUuid, gotCharacteristics);                             // Connect Arduino UUID
    myStatus = "Searching for Sensor";
    document.getElementById('status').innerHTML=myStatus;                       // Print sensor status
}

/* Stop Notification function */
function stopNotifications() {
    move(300);                                                                  // Reset progress bar
    myBLE.stopNotifications(myCharacteristic);                                  
    myStatus = "Not Connected";
    document.getElementById('status').innerHTML=myStatus;                       // Print sensor status
}

/* Bluetooth Connection: Arduino to JS*/  
function gotCharacteristics(error, characteristics) {
    if (error) console.log('error: ', error);                                   // Handle error message
        console.log('characteristics: ', characteristics);

    for(let i = 0; i < characteristics.length; i++) 
    {
       if(characteristics[i].uuid == characteristicUuid)                        // Check UUID
        {
            myCharacteristic = characteristics[0];                              // Start notification on first characteristic
            console.log(myCharacteristic.uuid);                               
            
            myBLE.startNotifications(myCharacteristic, handleNotifications);    // Callback function to handle notifications
            myStatus = "Connected";
            document.getElementById('status').innerHTML=myStatus;               // Print sensor status
        }
        else
        {console.log("Characteristic does not match");}                         
    }
}

/* Collect data function */
var counter = 0;                                                                // Progress Bar counter
function handleNotifications(data) {
    //console.log('data: ', data * 2);                                          // Print data
    myValue = data * 2;                                                         // Revert data to original size
    
    if(myValue == 0){                                                           // Data collection ends when data = 0
        //Format date and time to add "0"
        var myMonth = month().toString();                       
        if(parseInt(myMonth) < 10){myMonth = "0" + myMonth;}
        var myDay = day();
        if(myDay < 10){myDay = "0" + day().toString();}
        var myHour = hour();
        if(myHour<10){myHour="0" + hour().toString();}
        var myMinute = minute();
        if(myMinute<10){myMinute="0" + minute().toString();} 
        var mySecond = second();
        if(mySecond<10){mySecond="0" +second().toString();} 
        date = year().toString()+"-"+myMonth+"-"+myDay;                     // Record date of measurement
        time = myHour+"-"+myMinute+"-"+mySecond;                            // Record time of measurement
        var ref = database.ref("user/"+userName+"/"+date+"/"+time);             // Firebase directory
        move(200);                                                              // Progress bar complete (100%)
        ref.push(dataString);                                                   // Store data in Firebase
        
        myStatus="Done for " + userName;
        document.getElementById('status').innerHTML=myStatus;                   // Print sensor status

        dataString="";                                                          // Reset raw data variable
    }
    else{                                                                       // (Else) Collect data
        myStatus="Testing";                                                     
        document.getElementById('status').innerHTML=myStatus;                   // Print sensor status
        
        if (typeof myValue == "number" && myValue != "undefined"){              
            dataString += ",";                                                  // Add delimiter, data to raw data string
            dataString += myValue.toString();
        }

        counter ++;                                                             // Progress bar moved every 5 measurements (max 90%)
        if (counter == 5){                                                       
            move(1);    
            counter = 0;
        }
    };
    
}

/* Setup function */
function setup() {
    myBLE = new p5ble();                                                          // Initialize p5ble Library
    document.getElementById('status').innerHTML=myStatus;                         // Print sensor status

/*-------------------------------------------------------------------------

Firebase: setup + initialize 

-------------------------------------------------------------------------*/
    var firebaseConfig = {
        apiKey: "AIzaSyCTvctSrIFju8SFuLL2rn1tAvXJBauCLoI",
        authDomain: "gsrsensor.firebaseapp.com",
	    databaseURL: "https://gsrsensor-default-rtdb.firebaseio.com",
        projectId: "gsrsensor",
        storageBucket: "gsrsensor.appspot.com",
        messagingSenderId: "398502664861",
        appId: "1:398502664861:web:91bcd210f43e63aa629274",
        measurementId: "G-FV92WZ13SD"
    };

    firebase.initializeApp(firebaseConfig);
    database = firebase.database();

/*-------------------------------------------------------------------------

Retrieve Data from Firebase: User/username/date(YYYY-MM-DD)/time(HH-MM-SS)/key:values

-------------------------------------------------------------------------*/
    var leadsRef = database.ref('user/'+userName);                              // Firebase reference by userName
    leadsRef.on('value', function(snapshot) {                                   // Snapshot user's data
        userName=snapshot.key;
        //console.log("Username: "+ userName);                                  // Print username

        snapshot.forEach(function(childSnapshot) {                              // Snapshot child data (each day)
            //console.log("Added: " + childSnapshot.key)
            dateKeys.push(childSnapshot.key);                                   // Adds each unique date to dateKeys array
            startDate = dateKeys[0];

            var numChild = snapshot.child(childSnapshot.key).numChildren();     
            //console.log("Number measurements: " + numChild);
            dateKeys.push(numChild);                                            // Add number of measurements in a day to dateKeys array

      
            var childData = childSnapshot.val();                                // Time, key, sensor values snapshot
            var timeStamp = JSON.stringify(Object.keys(childData));             // Convert child object to String

        
            for (var t = 0; t < numChild; t++){                                 // Extract time stamps
                var start = timeStamp.indexOf('"');                             // First slice index
                timeStamp = timeStamp.slice(start + 1);

                var end = timeStamp.indexOf('"');                               // Second slice index
                var time = timeStamp.slice(0, end);
                timeStamp = timeStamp.slice(end + 1);

                timeKeys.push(time);                                            // Add time key to array

                var dataRaw = JSON.stringify(childData[time]);                  // Extract Sensor Values string (Key, values object convert to String)
            
                var firstComma = dataRaw.indexOf(",");                          // First slice index
                data = dataRaw.slice(firstComma + 1);

                var endQuote = data.indexOf("\"");                              // End slice index
                data = data.slice(0, endQuote);
                data = data.split(',').map(Number);                             // Numeric string mapped to integer array

                /*  Calculate: https://wiki.seeedstudio.com/Grove-GSR_Sensor/
                Human Resistance = ((1024+2*Serial_Port_Reading)*10000)/(512-Serial_Port_Reading)  */
                const ohms = data.map(x=>math.round(((1024 + (2*x))*10000)/((512-x)*1000)), 2); 
            
                values.push(ohms);                                              // Add calculated values to array
            }   
        });        

        /* Create charts */
        calcGraph();                                                          
        createCalendar();

  });
  
}

/*-------------------------------------------------------------------------

Chart：organize data, graph, and analyze

-------------------------------------------------------------------------*/
var dayAvg = [];                                                                // Array of daily averages
var time_avg = [];                                                              // Number measurements per day of measurement, averge per measurement
var time_index = 0;                                                             // Index of value analyzed

/* Calculate average data points on day for graph function */
function calcGraph(){
    for (var i = 0; i < dateKeys.length; i += 2){
        var count = dateKeys[i+1];                                              // Number measurements on given day

        var oneDay_avg = 0;                                                     // Average measurement of one day
        
        var index = 0;
        while(index < count){                                                   // Loop through measurements of one day

            var one_time = math.mean(values[time_index]);                       // Average value of one measurement
            time_avg.push(one_time);                                            // Add average into array

            oneDay_avg += one_time;                                             // Add average into accumulating average of one day

            time_index += 1;
            index += 1;
        }
    
        var singleObj = {};                                                     // Create object {x: #, y:#} for chart
        singleObj['x'] = dateKeys[i];                                           // X-coordinate: date of measurement
        singleObj['y'] = math.round(oneDay_avg/count);                          // Y-coordinate: average values per day

        dayAvg.push(singleObj);                                                 // Add object into array

    };


/*-------------------------------------------------------------------------

Chart 1: Average Measurement per Day chart

-------------------------------------------------------------------------*/
    var ctx = document.getElementById('myChart').getContext("2d");              // HTML

    var gradientStroke = ctx.createLinearGradient(0, 0, 0, 600);                // Create gradient for line
    gradientStroke.addColorStop(0, "#003bc4"); 
    gradientStroke.addColorStop(0.4, "#003bc4"); 
    gradientStroke.addColorStop(1, "#ff0000");
  
    var gradientFill = ctx.createLinearGradient(0, 0, 0, 600);                  // Create gradient for fill
    gradientFill.addColorStop(0, "rgba(128, 182, 244, 0.6)");
    gradientFill.addColorStop(0.4, "rgba(128, 182, 244, 0.6)");
    gradientFill.addColorStop(1, "rgba(244, 144, 128, 0.6)");
    
    var timeFormat = 'YYYY-MM-DD';                                              // Time Format
    
    /* Line Chart */
    var myChart = new Chart(ctx, {                                            
        type: 'line', 
        data: {
            datasets: [{
                data:  dayAvg,                                                  //Input array of objects {x: 'date', y: int}
                fill: true,                                                     //Graph Fill
                backgroundColor: gradientFill, 
                borderColor: gradientStroke,                                    //Line & point color
                pointBorderColor: "#370161",
                pointBackgroundColor: "#370161",
                pointRadius: 5,                                                 // Point size (pixels)
                borderWidth: 2,                                                 // Line width (pixels)
                pointHoverRadius: 10,                                           // Point hover animations
                pointHoverBackgroundColor: gradientFill,
                pointHoverBorderColor: "#071d66",
                pointHoverBorderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            title: {                                                            //Title style
                display: true,
                text: "Average Measurement Per Day",
                fontFamily: 'Arial',
                fontColor: "#000",
                fontStyle: 'bold',
                fontSize: 25,
                padding: 30
            },
            legend: {                                                           // Hide legend
                display: false 
            },
            scales: {                                                           // Time auto-scale x-axis (use date adapter)
                xAxes: [{
                    type: "time",
                    time: {
                        displayFormat: timeFormat,                              // Y-coordinate format must be YYYY-MM-DD
                        tooltipFormat: 'll',
                    },
                    scaleLabel: {                                               // X-axis label style
                        display: true,
                        labelString: 'Date of Measurement', 
                        fontFamily: 'Arial',
                        fontSize: 15
                    }
                }],
                yAxes: [{                                                       // Y-axis label style
                    scaleLabel: {
                        display: true,
                        labelString: 'Human Resistance (kilo-ohms)', 
                        fontFamily: 'Arial',
                        fontSize: 15
                    }
                }]
            }
        }
    });



}  

/*----------------------------------------------------------------------------

Calendar Date-picker：Retrieve data by datepicker (default days using moment.js array)

-----------------------------------------------------------------------------*/

/* Function to create calendar with disabled days for days without data */
function createCalendar(){

    var getDaysBetweenDates = function(start, endDate) {                             // Get array of dates between day of first measurement and today
        var now = start.clone(), dates = [];    
        while (now.isSameOrBefore(endDate)) {
            dates.push(now.format('YYYY-MM-DD'));
            now.add(1, 'days');
        }
        return dates;
    };
  
    var start = moment(startDate);                                                    // Call date array with moment.js to create array
    var endDate = moment();
    var dateList = getDaysBetweenDates(start, endDate);
    //console.log(dateList);

    for(var i = 0; i < dateKeys.length; i+=2){                                        // Reformat date to prevent 05 --> 5 (yyyy-mm-dd vs yyyy-m-d)
        var dataDate = String(dateKeys[i]);                                           
        var ymd = dataDate.split("-");

        for (var j = 0; j < dateList.length; j++){
            var ymmdd = dateList[j].split("-");
            
            if(parseInt(ymd[0])==parseInt(ymmdd[0]) && parseInt(ymd[1])==parseInt(ymmdd[1]) && parseInt(ymd[2])==parseInt(ymmdd[2])){
                dateList.splice(j, 1);
            }

        }
    }

    const Calender = document.querySelector('.datepicker');                             // HTML
    
    let disableDates = [];                                                              // Array of disabled dates

    for (var k = 0; k < dateList.length; k++){                                          // Reformat values to mm-dd-yyyy to prevent JS error
        var date = dateList[k].split("-");
        var correctDate = String(date[1] + "-" + date[2]+ "-" + date[0]);

        disableDates.push((new Date(correctDate).toDateString()));
        //console.log(new Date(correctDate).toDateString());
    }

    
    /* Date Picker  */
    M.Datepicker.init(Calender,{
        format: 'yyyy-mm-dd',                                                           // Format yyyy-mm-dd
        showClearBtn: true,
        minDate: new Date(startDate),                                                   // Start date: date of first measurement
        maxDate: new Date(),                                                            // End date: today
        disableDayFn: function(date){

            let disableListDate = disableDates;

            if(disableListDate.includes(date.toDateString())) { 
                return true;
            }else{
                return false;
            }
        }

    });

}

/* Function to convert ymd to ymmdd */
function similarDate(ymd, ymmdd){
    var ymdSplit = ymd.split("-");
    var ymmddSplit = ymmdd.split("-");

    if(parseInt(ymdSplit[0])==parseInt(ymmddSplit[0]) && parseInt(ymdSplit[1])==parseInt(ymmddSplit[1]) && parseInt(ymdSplit[2])==parseInt(ymmddSplit[2])){
        return true;
    }

    else{
        return false;
    }
}

/* Search Date from datepicker in Firebase dates function*/
function searchDate(){
    date = document.getElementById('date').value;
    if (date==""){
        alert("Please select a day");                                                   // Alert if no day selected
    }

    var timeIndex=0;                                                                    // index in timesarray
    var index;                                                                          //num day in fb
    var times;                                                                          // num times in day
    for (var i = 0; i < dateKeys.length; i+=2){                                         // Loop to find data in dateKeys array
        if(similarDate(dateKeys[i], date)){
            times = dateKeys[i + 1];
            index = i/2;
            break;
        }
        else{
            timeIndex += dateKeys[i+1];
        }
        
    }

    var dayArray=[];                                                                   // Array with average of each measurement
    var timeArray = [];
    var maxDrop = 0;                                                                   // Variable storing largest drop
    for (var j = timeIndex; j < (timeIndex + times); j++){
        dayArray.push(time_avg[j].toFixed(2));
        if(j >= timeIndex+1){                                                          // Find the largest drop
            var drop = Math.abs(parseFloat(time_avg[j]) - parseFloat(time_avg[j-1])).toFixed(2);

            if (parseFloat(maxDrop) < parseFloat(drop)){
                maxDrop = drop;
                //console.log("maxDrop is now: " + maxDrop);
            }
        }
        var timeReformat = timeKeys[j].split("-");                                    // Reformat time as 01:05.03 not 1:5.3
        if(parseInt(timeReformat[0])<10){timeReformat[0]=String("0" + timeReformat[0])};
        if(parseInt(timeReformat[1])<10){timeReformat[1]=String("0" + timeReformat[1])};
        if(parseInt(timeReformat[2])<10){timeReformat[2]=String("0" + timeReformat[2])};
        timeArray.push(timeReformat[0]+":"+timeReformat[1]+"."+timeReformat[2]);

    }
    
    console.log("6/3 data: " + dayArray);
/*-------------------------------------------------------------------------

Chart 2: Daily Measurement (average of each time measuring)

-------------------------------------------------------------------------*/
    var ctxs = document.getElementById('myDayChart').getContext("2d");                 // HTML
    const data={
        labels: timeArray,                                                             // Labels: timestamps of each measurement
        datasets: [
            {
                label: 'Dataset',                                                  
                borderColor: '#370161',                                                // Color of graph
                data: dayArray,
                fill: false,
                steppedLine: true,                                                     // Stepped line chart
            }
    ]
    };

    /* Create stepped line chart*/
    var myDayChart = new Chart(ctxs, {                                             
        type: 'line', 
        data: data,                                                                    // Chart data
        options: {                                                          
            interaction:{
                intersect:false,
                axis: 'x'
            },
            plugins:{
                title:{
                    display: true,
                    text: (ctx) => 'Step ' + ctxs.chart.data.datasets[0].stepped + ' Interpolation',
                }
            },
            responsive: true,
            title: {                                                                  // Title style
                display: true,
                text: "One Day Measurement",
                fontFamily: 'Arial',
                fontColor: "#000",
                fontStyle: 'bold',
                fontSize: 25,
                padding: 30
            },
            legend: {                                                                // Hide legend
                display: false 
            },
            scales: {                                                                // Time auto-scale x-axis (use date adapter)
                xAxes: [{
                    scaleLabel: {                                                    // X-axis label style
                        display: true,
                        labelString: 'Time of Measurement', 
                        fontFamily: 'Arial',
                        fontSize: 15
                    }
                }],
                yAxes: [{                                                            // Y-axis label style
                    scaleLabel: {
                        display: true,
                        labelString: 'Human Resistance (kilo-ohms)', 
                        fontFamily: 'Arial',
                        fontSize: 15
                    }
                }]
            }
        }
    });


    /* Analysis text*/
    document.getElementById("analyzeDrop").innerHTML = "The max drop on this day is: " + maxDrop;
    document.getElementById("analyzedDrop").innerHTML = "The higher the drop, the more likely you are to feel stressed <br> <i>If there is only one measurement, the drop will be zero </i>";
}

/* Return to main page */
function returnpage(){
    window.location.href= 'index.html';
}