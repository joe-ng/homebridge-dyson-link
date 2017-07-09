const DysonLinkDevice = require("./DysonLinkDevice").DysonLinkDevice;

class DysonLinkAccessoryHelper {
    constructor(device, accessory, log) {
        

        this.device = device;
        this.accessory = accessory;
        this.log = log;

        this.initSensor();
        this.initFanState();
    }

    initSensor() {
        this.accessory.addService(Service.TemperatureSensor, this.displayName)
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({ minValue: -50, maxValue: 100 })
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
        let fan = this.accessory.addService(Service.Fan,this.displayName);

        fan.getCharacteristic(Characteristic.On)
            .on("get", this.device.isFanOn.bind(this.device))
            .on("set", this.device.setFanOn.bind(this.device));
        fan.getCharacteristic(Characteristic.RotationSpeed)
            .on("get", this.device.isRotate.bind(this.device))
            .on("set", this.device.setRotate.bind(this.device));

        this.accessory.addService(Service.Switch , "Rotation - " + this.displayName, "Rotate")
            .getCharacteristic(Characteristic.On)
            .on("get", this.device.getRotateSpeed.bind(this.device))
            .on("set", this.device.setRotateSpeed.bind(this.device));

        this.accessory.addService(Service.Switch, "Auto - " + this.displayName, "Auto")
            .getCharacteristic(Characteristic.On)
            .on("get", this.device.isFanAuto.bind(this.device))
            .on("set", this.device.setFanAuto.bind(this.device));

    }
}


module.exports = {
    DysonLinkAccessoryHelper
}