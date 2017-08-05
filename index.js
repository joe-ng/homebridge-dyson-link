"use strict";

const DysonLinkAccessoryModule = require("./DysonLinkAccessory");
const DysonLinkDevice = require("./DysonLinkDevice").DysonLinkDevice;
const DysonLinkAccessory = DysonLinkAccessoryModule.DysonLinkAccessory;

var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    console.log("homebridge API version: " + homebridge.version);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    DysonLinkAccessoryModule.setHomebridge(homebridge);

    // For platform plugin to be considered as dynamic platform plugin,
    // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
    homebridge.registerPlatform("homebridge-dyson-link", "DysonPlatform", DysonPlatform, true);
}

class DysonPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.accessories = [];

        if (api) {
            // Save the API object as plugin needs to register new accessory via this object.
            this.api = api;
            var platform = this;
            // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
            // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
            // Or start discover new accessories
            this.api.on('didFinishLaunching',  () => {

                platform.log("Finished launching. Start to create accessory from config");
                this.config.accessories.forEach((accessory) => {
                    platform.log(accessory.displayName + " IP:" + accessory.ip + " Serial Number:" + accessory.serialNumber);
                    let device = new DysonLinkDevice(accessory.displayName, accessory.ip, accessory.serialNumber, accessory.password, platform.log);
                    if (device.valid) {
                        platform.log("Device serial number format valids");
                        let uuid = UUIDGen.generate(accessory.serialNumber);
                        // Check if the accessory got cached
                        let cachedAccessory = platform.accessories.find((item) => item.UUID === uuid);
                        if (!cachedAccessory) {
                            platform.log("Device not cached. Create a new one");
                            let dysonAccessory = new Accessory(accessory.displayName, uuid);
                            new DysonLinkAccessory(accessory.displayName, device, dysonAccessory, platform.log);
                            platform.api.registerPlatformAccessories("homebridge-dyson-link", "DysonPlatform", [dysonAccessory]);
                            platform.accessories.push(accessory);
                        }
                        else {
                            platform.log("Device cached. Try to update this");
                            cachedAccessory.displayName = accessory.displayName;                  
                            new DysonLinkAccessory(accessory.displayName, device, cachedAccessory, platform.log);
                            platform.api.updatePlatformAccessories([cachedAccessory]);                            
                        }
                    }
                });
            });
        }
       
    }

    configureAccessory(accessory) {
        this.log(accessory.displayName, "Configure Accessory");
        accessory.reachable = true;
        accessory.on('identify', (paired, callback) => {
            this.log(accessory.displayName, "Identify!!!");
            callback();
        });

        this.accessories.push(accessory);
    }
}