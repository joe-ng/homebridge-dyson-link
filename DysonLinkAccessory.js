const DysonLinkDevice = require("./DysonLinkDevice").DysonLinkDevice;

var Accessory, Service, Characteristic;

function setHomebridge(homebridge) {
    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
}

class DysonLinkAccessoryHelper {
    constructor(displayName, device, accessory, log) {


        this.device = device;
        this.accessory = accessory;
        this.log = log;
        this.displayName = displayName;

        this.initSensor();
        this.initFanState();
    }

    initSensor() {
        this.log("Init Sensor for " + this.displayName);
        this.accessory.addService(Service.TemperatureSensor, this.displayName)
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({ minValue: -50, maxValue: 100, unit: "celsius" })
            .on("get", this.device.getTemperture.bind(this.device));
        this.accessory.addService(Service.HumiditySensor, this.displayName)
            .getCharacteristic(Characteristic.CurrentRelativeHumidity)
            .setProps({ minValue: 0, maxValue: 100 })
            .on("get", this.device.getHumidity.bind(this.device));

        this.accessory.addService(Service.AirQualitySensor, this.displayName)
            .getCharacteristic(Characteristic.AirQuality)
            .on("get", this.device.getAirQuality.bind(this.device));
    }

    initFanState() {
        this.log("Init Fan State for " + this.displayName);
        let fan = this.accessory.addService(Service.Fan, this.displayName);

        fan.getCharacteristic(Characteristic.On)
            .on("get", this.device.isFanOn.bind(this.device))
            .on("set", this.device.setFanOn.bind(this.device));
        this.accessory.addService(Service.Switch, "Auto - " + this.displayName, "Auto")
            .getCharacteristic(Characteristic.On)
            .on("get", this.device.isFanAuto.bind(this.device))
            .on("set", this.device.setFanAuto.bind(this.device));


        // This is actually the fan speed instead of rotation speed but homekit fan does not support this
        fan.getCharacteristic(Characteristic.RotationSpeed)
            .on("get", this.device.getFanSpeed.bind(this.device))
            .on("set", this.device.setFanSpeed.bind(this.device));

        this.accessory.addService(Service.Switch, "Rotation - " + this.displayName, "Rotate")
            .getCharacteristic(Characteristic.On)
            .on("get", this.device.isRotate.bind(this.device))
            .on("set", this.device.setRotate.bind(this.device));

        // Set Heat 
        if (this.device.heatAvailable) {
            this.log("Heat Available. Add Heat button");
            this.accessory.addService(Service.Switch, "Heat - " + this.displayName, "Heat")
                .getCharacteristic(Characteristic.On)
                .on("get", this.device.isHeatOn.bind(this.device))
                .on("set", this.device.setHeatOn.bind(this.device));
        }


    }
}


module.exports = {
    DysonLinkAccessoryHelper, setHomebridge
}