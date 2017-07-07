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

    //DysonLinkAccessoryModule.setHomebridge(homebridge);

    // For platform plugin to be considered as dynamic platform plugin,
    // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
    homebridge.registerPlatform("homebridge-dyson-link", "DysonPlatform", DysonPlatform, true);
}

class DysonPlatform {
    constructor(log, config, api) {
        config.accessories.forEach((accessory) => {
            let device = new DysonLinkDevice(accessory.ip, accesssory.serialNumber, accessory.password, log);
            if (device.valid) {
                let uuid = UUIDGen.generate(serialNumber);
                let dysonAccessory = new Accessory(accessory.displayName, uuid);
                new DysonLinkAccessoryHelper(device, dysonAccessory, log);
                this.api.registerPlatformAccessories("homebridge-dyson-link", "DysonPlatform", dysonAccessory);

            }
        });
    }
}