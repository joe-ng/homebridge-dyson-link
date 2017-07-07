const DysonLinkDevice = require("./DysonLinkDevice").DysonLinkDevice;

class DysonLinkAccessoryHelper {
    constructor(device, accessory, log) {
        

        this.device = device;
        this.accessory = accessory;
        this.log = log;

        initSensor();
        initFanState();
    }

    initSensor() {
        this.accessory.addService(Service.TemperatureSensor, this.displayName)
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({ minValue: -50, maxValue: 100 })
            .on("get", this.device.getTemperture);
        this.accessory.addService(Service.HumiditySensor, this.displayName)
            .getCharacteristic(Characteristic.CurrentRelativeHumidity)
            .setProps({ minValue: 0, maxValue: 100 })
            .on("get", this.device.getHumidity);

        this.accessory.addService(Service.AirQualitySensor, this.displayName)
            .getCharacteristic(Characteristic.AirQuality)
            .on("get", this.device.getAirQuality);
    }

    initFanState() {
        let fan = this.accessory.addService(Service.Fan,this.displayName);

        fan.getCharacteristic(Characteristic.On)
            .on("get", this.device.isFanOn)
            .on("set", this.device.setFanOn);
        fan.getCharacteristic(Characteristic.RotationSpeed)
            .on("get", this.device.isRotate)
            .on("set", this.device.setRotate);

        this.accessory.addService(Service.Switch , "Rotation - " + this.displayName)
            .getCharacteristic(Characteristic.On)
            .on("get", this.device.getRotateSpeed)
            .on("set", this.device.setRotateSpeed);

        this.accessory.addService(Service.Switch, "Auto - " + this.displayName)
            .getCharacteristic(Characteristic.On)
            .on("get", this.device.isFanAuto)
            .on("set", this.device.setFanAuto);

    }
}


module.exports = {
    DysonLinkAccessoryHelper
}