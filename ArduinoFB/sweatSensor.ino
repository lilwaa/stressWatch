/*Project Name: StressWatch (BME/CSE Wearable Sensor)
  File Name: sweatSensor.ino
  Team Members: Megan Lu, Kristen Park, Kanita Sivananthan, Lily Wang
  Team Member Responsible: Lily Wang
  Date: 6/4/20

  Task Description: Arduino Code
  -  Collect GSR Sensor data from A0 pin
  -  Neopixel LED light: blue (connect to bluetooth), rainbow (testing), green (complete testing), turn off
  -  Connect to bluetooth with UUID

*/

/* Arduino Libraries */
#include <Adafruit_NeoPixel.h>
#include <ArduinoBLE.h>

/*Define PINs*/
#define PIN 5                                                                     // Neopixel Ring Data In (Pin 5)

Adafruit_NeoPixel strip = Adafruit_NeoPixel(16, PIN, NEO_GRB + NEO_KHZ800);  
// Neopixel strip description:      
// Parameter 1 = number of pixels in strip
// Parameter 2 = pin number (most are valid)
// Parameter 3 = pixel type flags, add together as needed:
//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)
//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)
//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)
//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)

/* Define variables */
const int GSR=A0;
int sensorValue=0;
int gsr_average=0;

int state=0;              //State 0 (initial), State 1 (testing), State 2(complete)
int count=0;
int gsrValues[] = {};
int loopCount=0;
int bleStatus=0;

/* Define Bluetooth Service*/
BLEService gsrService("19B10010-E8F2-537E-4F6C-D104768A1214");                                                  // create service
BLEByteCharacteristic gsrCharacteristic("19B10011-E8F2-537E-4F6C-D104768A1214", BLERead | BLEWrite | BLENotify);

 
void setup(){
  Serial.begin(9600);
  while (!Serial);

  /*Neopixel initialization*/
  strip.begin();
  strip.setBrightness(60);  // LED Brightness
  strip.show();             // All pixels to 'off' 

  /*Bluetooth initialization*/
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");

    while (1);
  }
  
  // Local name of peripheral advertises
  BLE.setLocalName("StressWatch");
  
  // Local UUID for service this peripheral advertises:
  BLE.setAdvertisedService(gsrService);

  // Add the characteristics to the service
  gsrService.addCharacteristic(gsrCharacteristic);

  // Add the service
  BLE.addService(gsrService);

  // LED turns blue when bluetooth is ready
  colorWipe(strip.Color(0, 0, 64), 100); // Color: blue 
  colorWipe(strip.Color(0,0,0), 100); // Black

  // start advertising
  BLE.advertise();
  Serial.println("Bluetooth device active, waiting for connections...");
}
 
void loop(){
  // poll for BLE events
  BLE.poll();
  BLEDevice central = BLE.central();
  if(central)
  {
    Serial.println("connected to central:");
    Serial.println(central.address());
    bleStatus=1;
  }
  else
    bleStatus=0;

  /* Take measurements from GSR Sensor as soon as device is connected by bluetooth*/  
  long sum=0;
  for(int i=0;i<10;i++)                 // Average 10 measurements to remove the glitch
  {
      sensorValue=analogRead(GSR);
      sum += sensorValue;
      delay(5); 
  }
  gsr_average = sum/10;
  //Serial.println(gsr_average);

  /* When GSR reads value less than 450, rainbow cycle starts */
  if(gsr_average < 450 && state == 0){
    state = 1;
    
    rainbowCycle(15); // Starts Rainbow cycle (testing state)

    // End of Rainbow cycle
    if(state == 1){
      colorWipe(strip.Color(0, 32, 0), 100); //Green
      Serial.println("Count: " ); // Number data points
      Serial.println(count);
      count = 0;                  // Reset value
      
      gsrCharacteristic.writeValue(0); // Sets value property

      // LED lights stay green until fingers are removed
      while( sensorValue < 450){
         delay(1);
         sensorValue=analogRead(GSR);
      }
    }
    state = 0; // change state
    colorWipe(strip.Color(0,0,0), 100); // Turn off LED
  }
  else{
    Serial.end();
  }
  
}

// Fill the dots one after the other with a color
void colorWipe(uint32_t c, uint8_t wait) {
  for(uint16_t i=0; i<strip.numPixels(); i++) {
      strip.setPixelColor(i, c);
      strip.show();
      delay(wait);
  }
}

// Rainbow Cycle function
void rainbowCycle(uint8_t wait) {
  uint16_t i, j;
  delay(15);       // Take off beginning values

  // 2 cycles of all colors on wheel
  for(j=0; j<256*2; j++) {      
    for(i=0; i< strip.numPixels(); i++) {
      strip.setPixelColor(i, Wheel(((i * 256/ strip.numPixels()) + j) & 255));
    }
    strip.show();

    // Take GSR measurements
    long sum=0;
    for(int i=0;i<10;i++)           //Average the 10 measurements to remove the glitch
    {
         sensorValue=analogRead(GSR);
         sum += sensorValue;
         delay(1); //Delay between

         // Check if fingers are in sensor
         if(sensorValue > 450)
            {
              sensorValue=analogRead(GSR);
              delay(5);
              if(sensorValue > 450){
                state = 2;
                count = 0;
                break;
               }
             
            }
    }
    gsr_average = sum/10;
    Serial.println(gsr_average);
    count += 1;

    // Divide values by 2 (decrease storage in bytes of array)
    if(bleStatus == 1){
       gsrCharacteristic.writeValue(gsr_average/2);
    }
  }
}

// Input a value 0 to 255 to get a color value.
// The colours are a transition r - g - b - back to r.
uint32_t Wheel(byte WheelPos) {
  if(WheelPos < 85) {
   return strip.Color(WheelPos * 3, 255 - WheelPos * 3, 0);
  } else if(WheelPos < 170) {
   WheelPos -= 85;
   return strip.Color(255 - WheelPos * 3, 0, WheelPos * 3);
  } else {
   WheelPos -= 170;
   return strip.Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
}