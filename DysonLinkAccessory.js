const DysonLinkDevice = require("./DysonLinkDevice").DysonLinkDevice;

var Accessory, Service, Characteristic;

function setHomebridge(homebridge) {
    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
}

class DysonLinkAccessory {
    constructor(displayName, device, accessory, log, nightModeVisible, focusModeVisible, autoModeVisible) {


        this.device = device;
        this.device.accessory = this;

        this.accessory = accessory;
        this.log = log;
        this.displayName = displayName;

        this.nightModeVisible = nightModeVisible;
        this.focusModeVisible = focusModeVisible;
        this.autoModeVisible = autoModeVisible;

        this.initSensor();
        this.initFanState();
    }

    // updateFanState() {
    //     this.fan.getCharacteristic(Characteristic.On).updateValue(this.device.fanState.fanOn);        
    //     this.autoSwitch.getCharacteristic(Characteristic.On).updateValue(this.device.fanState.fanAuto);        

    //     if (this.device.heatAvailable) {
    //         this.heatSwitch.getCharacteristic(Characteristic.On).updateValue(this.device.fanState.fanHeat);
    //     }
    // }

    initSensor() {
        this.log("Init Sensor for " + this.displayName);
        this.temperatureSensor = this.getService(Service.TemperatureSensor);
        this.temperatureSensor
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({ minValue: -50, maxValue: 100, unit: "celsius" })
            .on("get", this.device.getTemperture.bind(this.device));

        this.humiditySensor = this.getService(Service.HumiditySensor);
        this.humiditySensor
            .getCharacteristic(Characteristic.CurrentRelativeHumidity)
            .setProps({ minValue: 0, maxValue: 100 })
            .on("get", this.device.getHumidity.bind(this.device));

        this.airSensor = this.getService(Service.AirQualitySensor);
        this.airSensor
            .getCharacteristic(Characteristic.AirQuality)
            .on("get", this.device.getAirQuality.bind(this.device));


        if (this.device.model == "438" || this.device.model == "520") {
            this.airSensor.getCharacteristic(Characteristic.PM2_5Density)
                .on("get", this.device.getPM2_5Density.bind(this.device));
            this.airSensor.getCharacteristic(Characteristic.PM10Density)
                .on("get", this.device.getPM10Density.bind(this.device));
            this.airSensor.getCharacteristic(Characteristic.VOCDensity)
                .on("get", this.device.getVOCDensity.bind(this.device));
            this.airSensor.getCharacteristic(Characteristic.NitrogenDioxideDensity)
                .on("get", this.device.getNitrogenDioxideDensity.bind(this.device));
        }

        // Updates the accessory information
        var accessoryInformationService = this.getService(Service.AccessoryInformation);
        accessoryInformationService.setCharacteristic(Characteristic.Manufacturer, "Dyson");
        if (this.device.model == "438" || this.device.model == "520") {
            accessoryInformationService.setCharacteristic(Characteristic.Model, "Dyson Pure Cool " + this.device.model);
        } else {
            accessoryInformationService.setCharacteristic(Characteristic.Model, "Dyson " + this.device.model);
        }
        accessoryInformationService.setCharacteristic(Characteristic.SerialNumber, this.device.serialNumber);
    }

    initFanState() {
        this.log("Init Fan State for " + this.displayName);

        // Remove Fan V1 and rotate switch if it exists
        var fanV1 = this.accessory.getService(Service.Fan);
        if (fanV1) {
            this.log("fan v1 found. Remove this now");
            this.accessory.removeService(fanV1);
        }
        var rotateSwitch = this.accessory.getServiceByUUIDAndSubType(Service.Switch, "Rotate");
        if(rotateSwitch) {
            this.log("Rotate switch found. Remove this now");
            this.accessory.removeService(rotateSwitch);
        }
        var autoSwitch = this.accessory.getServiceByUUIDAndSubType(Service.Switch, "Auto");
        if(autoSwitch) {
            this.log("Auto switch found. Remove this now");
            this.accessory.removeService(autoSwitch);
        }

        this.fan = this.getService(Service.Fanv2); 

        this.fan.getCharacteristic(Characteristic.Active)
            .on("get", this.device.isFanOn.bind(this.device))
            .on("set", this.device.setFanOn.bind(this.device));
            
        this.fan.getCharacteristic(Characteristic.SwingMode)
            .on("get", this.device.isRotate.bind(this.device))
            .on("set", this.device.setRotate.bind(this.device));



        // Don't seem to be called by homekit at all
        // this.fan.getCharacteristic(Characteristic.CurrentFanState)
        //     .on("set", this.device.setCurrentFanState.bind(this.device))
        //     .on("get", this.device.getCurrentFanState.bind(this.device));     

        // This is actually the fan speed instead of rotation speed but homekit fan does not support this
        this.fan.getCharacteristic(Characteristic.RotationSpeed)
            .setProps({
                minStep: 10
            })
            .on("get", this.device.getFanSpeed.bind(this.device))
            .on("set", this.device.setFanSpeed.bind(this.device));        

        if(this.nightModeVisible) {
            this.log.info("Night mode button is added");
            this.nightModeSwitch = this.getServiceBySubtype(Service.Switch, "Night Mode - " + this.displayName, "Night Mode");

            this.nightModeSwitch
                .getCharacteristic(Characteristic.On)
                .on("get", this.device.isNightMode.bind(this.device))
                .on("set", this.device.setNightMode.bind(this.device));
        }
        else {
            this.log.info("Night mode button is hidden");
            let nightSwtich = this.accessory.getServiceByUUIDAndSubType(Service.Switch, "Night Mode");
            if(nightSwtich){
                this.accessory.removeService(nightSwtich);
            }
        }

        // Create FilterMaintenance 
        this.filter = this.getService(Service.FilterMaintenance);
        this.filter.getCharacteristic(Characteristic.FilterChangeIndication)
            .on("get", this.device.getFilterChange.bind(this.device));
        this.filter.getCharacteristic(Characteristic.FilterLifeLevel)
            .on("get", this.device.getFilterLife.bind(this.device));
        // Add this to fan too
        this.fan.getCharacteristic(Characteristic.FilterChangeIndication)
            .on("get", this.device.getFilterChange.bind(this.device));
        this.fan.getCharacteristic(Characteristic.FilterLifeLevel)
            .on("get", this.device.getFilterLife.bind(this.device));

        // Set Heat 
        if (this.device.heatAvailable) {
            this.log("Heat Available. Add Heat button and jet control");
            this.heater = this.getService(Service.HeaterCooler);

            this.heater.getCharacteristic(Characteristic.Active)
                .on("get", this.device.isFanOn.bind(this.device))
                .on("set", this.device.setHeaterOn.bind(this.device));

            this.heater.getCharacteristic(Characteristic.CurrentHeaterCoolerState)
                .on("set", this.device.setCurrentHeaterCoolerState.bind(this.device))
                .on("get", this.device.getCurrentHeaterCoolerState.bind(this.device));

            if (this.device.model === '527') {
                this.heater.getCharacteristic(Characteristic.TargetHeaterCoolerState)
                    .on("get", this.device.getHeaterCoolerState.bind(this.device))
                    .on("set", this.device.setHeaterCoolerState.bind(this.device))
                    .setProps({
                        // Disable COOL and AUTO, leave only HEAT
                        validValues: [1],
                    });
            } else {
                this.heater.getCharacteristic(Characteristic.TargetHeaterCoolerState)
                    .on("get", this.device.getHeaterCoolerState.bind(this.device))
                    .on("set", this.device.setHeaterCoolerState.bind(this.device));
            }

            this.heater.getCharacteristic(Characteristic.CurrentTemperature)
                .on("get", this.device.getTemperture.bind(this.device));

            this.heater.getCharacteristic(Characteristic.HeatingThresholdTemperature)
                .on("set", this.device.setThresholdTemperture.bind(this.device))
                .on("get", this.device.getThresholdTemperture.bind(this.device))
                .setProps({ minValue: 1, maxValue: 38, unit: "celsius" })

            var heatSwitch = this.accessory.getServiceByUUIDAndSubType(Service.Switch, "Heat");
            if(heatSwitch) {
                this.log("Heat switch found. Remove this now and replace with heater");
                this.accessory.removeService(heatSwitch);
            }
            // this.heatSwitch = this.getServiceBySubtype(Service.Switch, "Heat - " + this.displayName, "Heat");
            // this.heatSwitch
            //     .getCharacteristic(Characteristic.On)
            //     .on("get", this.device.isHeatOn.bind(this.device))
            //     .on("set", this.device.setHeatOn.bind(this.device));


            
            
            // Set the auto/manual mode in the FanV2 just for Cool/Heat device as it seemed to be problem for cool device
            // Removed this for now as FanV2 is not working for this
            // this.fan.getCharacteristic(Characteristic.TargetFanState)
            //     .setValue(0)
            //     .on("get", this.device.isFanAuto.bind(this.device))
            //     .on("set", this.device.setFanAuto.bind(this.device));
            // Remove the auto/manual characteristic from FanV2 and use button instead to workaround the existing issue
            var targetFanCharacteristic = this.fan.getCharacteristic(Characteristic.TargetFanState);
            if(targetFanCharacteristic){
                this.fan.removeCharacteristic(targetFanCharacteristic);
            }

            this.autoSwitch = this.getServiceBySubtype(Service.Switch, "Auto - " + this.displayName, "Auto");
            
            this.autoSwitch
                .getCharacteristic(Characteristic.On)
                .on("get", this.device.isFanAuto.bind(this.device))
                .on("set", this.device.setFanAuto.bind(this.device));
}
        else{

            // Remove the auto/manual characteristic from FanV2 and use button instead to workaround the existing issue
            var targetFanCharacteristic = this.fan.getCharacteristic(Characteristic.TargetFanState);
            if(targetFanCharacteristic){
                this.fan.removeCharacteristic(targetFanCharacteristic);
            }

            if (this.autoModeVisible) {
                this.autoSwitch = this.getServiceBySubtype(Service.Switch, "Auto - " + this.displayName, "Auto");
                this.autoSwitch
                    .getCharacteristic(Characteristic.On)
                    .on("get", this.device.isFanAuto.bind(this.device))
                    .on("set", this.device.setFanAuto.bind(this.device));
            }
            
        }

        // Add jet focus for Cool/Heat and 2018 Cool device
        if((this.device.heatAvailable && this.device.model !== '527') || this.device.is2018Dyson) {
            if(this.focusModeVisible) {
                this.log.info("Jet Focus mode button is added");
                this.focusSwitch = this.getServiceBySubtype(Service.Switch, "Jet Focus - " + this.displayName, "Jet Focus");
                
                this.focusSwitch
                    .getCharacteristic(Characteristic.On)
                    .on("get", this.device.isFocusedJet.bind(this.device))
                    .on("set", this.device.setFocusedJet.bind(this.device));

            }
            else {
                this.log.info("Jet Focus mode button is hidden");
                let focusSwtich = this.accessory.getServiceByUUIDAndSubType(Service.Switch, "Jet Focus");
                if(focusSwtich){
                    this.accessory.removeService(focusSwtich);
                }
            }
        }
    }

    getService(serviceType) {
        let service = this.accessory.getService(serviceType);
        if (!service) {
            service = this.accessory.addService(serviceType, this.displayName);
        }
        return service;
    }

    getServiceBySubtype(serviceType, displayName, subType) {
        let service = this.accessory.getServiceByUUIDAndSubType(serviceType, subType);
        if (!service) {
            service = this.accessory.addService(serviceType, displayName, subType);
        }

        return service;
    }

    isSwingModeButtonOn(){
        return this.fan.getCharacteristic(Characteristic.SwingMode).value;

    }

    getFanSpeedValue(){
        return this.fan.getCharacteristic(Characteristic.RotationSpeed).value;
    }


    isNightModeSwitchOn(){
        if(this.nightModeSwitch) {
            return this.nightModeSwitch.getCharacteristic(Characteristic.On).value;
        }
        else {
            return false;
        }
    }
}


module.exports = {
    DysonLinkAccessory, setHomebridge
}
