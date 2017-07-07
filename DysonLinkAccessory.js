const DysonLinkDevice = require("./DysonLinkDevice").DysonLinkDevice;

var Accessory, Service, Characteristic, UUIDGen;

module.exports = {
    setHomebridge, DysonLinkAccessroy
}


function setHomebridge(homebridge) {
    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
}

class DysonLinkAccessory extends Accessory {
    constructor(device, displayName, UUID, log, category) {
        super(displayName, UUID, category);

        this.device = device;
        this.log = log;

        initSensor();
        initFanState();
    }

    initSensor() {
        this.addService(Service.TemperatureSensor, this.displayName)
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({ minValue: -50, maxValue: 100 })
            .on("get", this.device.getTemperture);
        this.addService(Service.HumiditySensor, this.displayName)
            .getCharacteristic(Characteristic.CurrentRelativeHumidity)
            .setProps({ minValue: 0, maxValue: 100 })
            .on("get", this.device.getHumidity);

        this.addService(Service.AirQualitySensor, this.displayName)
            .getCharacteristic(Characteristic.AirQuality)
            .on("get", this.device.getAirQuality);
    }

    initFanState() {
        let fan = this.addService(Service.Fan,this.displayName);

        fan.getCharacteristic(Characteristic.On)
            .on("get", this.device.isFanOn)
            .on("set", this.device.setFanOn);
        fan.getCharacteristic(Characteristic.RotationSpeed)
            .on("get", this.device.isRotate)
            .on("set", this.device.setRotate);

        this.addService(Service.Switch , "Rotation - " + this.displayName)
            .getCharacteristic(Characteristic.On)
            .on("get", this.device.getRotateSpeed)
            .on("set", this.device.setRotateSpeed);

        this.addService(Service.Switch, "Auto - " + this.displayName)
            .getCharacteristic(Characteristic.On)
            .on("get", this.device.isFanAuto)
            .on("set", this.device.setFanAuto);

    }
}