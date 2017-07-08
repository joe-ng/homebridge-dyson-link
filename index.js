"use strict";

const DysonLinkAccessoryModule = require("./DysonLinkAccessory");
const DysonLinkDevice = require("./DysonLinkDevice").DysonLinkDevice;
const DysonLinkAccessoryHelper = DysonLinkAccessoryModule.DysonLinkAccessoryHelper;

var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    console.log("homebridge API version: " + homebridge.version);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

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

            // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
            // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
            // Or start discover new accessories
            this.api.on('didFinishLaunching', function () {

                this.log("Finished launching. Start to create accessory from config");
                config.accessories.forEach((accessory) => {
                    this.log(accessory.displayName + " IP:" + accessory.ip + " Serial Number:" + accessory.serialNumber);
                    let device = new DysonLinkDevice(accessory.ip, accessory.serialNumber, accessory.password, log);
                    if (device.valid) {
                        this.log("Device serial number format valids");
                        let uuid = UUIDGen.generate(accessory.serialNumber);
                        // Check if the accessory got cached
                        if (!this.accessories.find((item) => item.UUID === uuid)) {
                            this.log("Device not cached. Create a new one");
                            let dysonAccessory = new Accessory(accessory.displayName, uuid);
                            new DysonLinkAccessoryHelper(device, dysonAccessory, log);
                            api.registerPlatformAccessories("homebridge-dyson-link", "DysonPlatform", [dysonAccessory]);
                            this.accessories.push(accessory);
                        }
                        else {
                            this.log("Device cached.");
                        }
                    }
                });
            });
        }
       
    }

    configureAccessory(accessory) {
        this.log(accessory.displayName, "Configure Accessory");
        accessory.reachable = true;
        accessory.on('identify', function (paired, callback) {
            platform.log(accessory.displayName, "Identify!!!");
            callback();
        });

        this.accessories.push(accessory);
    }
}