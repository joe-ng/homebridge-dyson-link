# homebridge-dyson-link

## Introduction
This is just a hobby project as I just bought my Dyson Link device and would like to use Siri and Home App to control that. I decided to share here just in case if this can be somewhat useful to others, that will be great. :)

## Installation

Assuming you have homebridge installed and set up, you can run below command to install this plugin

`npm install -g homebridge-dyson-link`

Then, you can add the platform configuration to your config.json

## Configuration

See config-sample.json for example

We will need to input the IP, display name, serial number and password to the config

The serial number(DYSON-XXX-XX-XXXXXXXX-XXX) and password(normally 8 characters) of your device can be found on the device and the manual. The serial number here is the same as the SSID of your Dyson wifi and the password is the wifi password. 
Note: Be sure to remove the commit lines (like `// this is ..`) below before you paste the config to your homebridge config.

```js
"platforms": [
    // This is the config for this plugin  
    {
      "platform": "DysonPlatform",
      "name": "DysonPlatform",
      "accessories": [
        {
          "ip": "ip of your device",
          "displayName": "Name to be shown on Home App",
          "serialNumber": "DYSON-XXX-XX-XXXXXXXX-XXX",
          "password": "password of your device"
        },
        {
          "ip": "ip of your second device",
          "displayName": "Name to be shown on Home App",
          "serialNumber": "DYSON-XXX-XX-XXXXXXXX-XXX",
          "password": "password of your second device"
        }
        // If you have more than one device(s), just add the same config below
      ]
    }
    // End of the config
  ],
```

For newer models, (like TP04/DP04), authentication is enabled by using a Dyson account registered with the device. Add email, password to the platform configuration or set the environment variables DYSON_EMAIL and DYSON_PASSWORD. For example:

```js
"platforms": [
    // This is the config for this plugin  
    {
      "platform": "DysonPlatform",
      "name": "DysonPlatform",
      "email": "dysonuser@dyson.com", // or set DYSON_EMAIL="email"
      "password": "password",         // or set DYSON_PASSWORD="password"
      "country": "US"                 // be sure to change if not US
      "accessories": [
        {
          "ip": "ip of your device",
          "displayName": "Name to be shown on Home App",
          "serialNumber": "XXX-XX-XXXXXXXX"
          // No device password needed if TP04 or DP04
        },
        {
          "ip": "ip of your second device",
          "displayName": "Name to be shown on Home App",
          "serialNumber": "DYSON-XXX-XX-XXXXXXXX-XXX",
          "password": "password of your second device"
          // Password may be used with other models
        }
      ]
    }
  ],
```

There are a few optional parameters for each accessory, E.g.


```js
"accessories": [
        {
          "ip": "ip of your device",
          "displayName": "Name to be shown on Home App",
          "serialNumber": "XXX-XX-XXXXXXXX",
          // No device password needed if TP04 or DP04

          // This controls the visibility of Night Mode button, default to true
          "nightModeVisible" : true,

          // This controls the visibility of Jet Focus button, default to true
          "focusModeVisible" : true,

          // This controls the visibility of Auto button, default to true
          "autoModeVisible" : true

        },
        {
          "ip": "ip of your second device",
          "displayName": "Name to be shown on Home App",
          "serialNumber": "DYSON-XXX-XX-XXXXXXXX-XXX",
          "password": "password of your second device"
          // Password may be used with other models

          // This controls the visibility of Night Mode button, default to true
          "nightModeVisible" : true,

          // This controls the visibility of Jet Focus button, default to true
          "focusModeVisible" : true
        }
      ]
```

## Features Supported

* Fan On/Off
* Fan Speed
* Rotation On/Off
* Auto On/Off
* Night Mode On/Off
* Jet Focus On/Off
* Heat On/Off and target tempeture (If your device supports this)
* Display filter life
