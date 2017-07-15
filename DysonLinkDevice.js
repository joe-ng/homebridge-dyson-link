"use strict";

const mqtt = require('mqtt');
const crypto = require('crypto');
const EventEmitter = require("events").EventEmitter;
const DysonFanState = require("./DysonFanState").DysonFanState;
const DysonEnvironmentState = require("./DysonEnvironmentState").DysonEnvironmentState;



class DysonLinkDevice {
    static get SENSOR_EVENT() { return "sensor-updated"; }
    static get STATE_EVENT() { return "state-updated"; }

    constructor(displayName, ip, serialNumber, password, log) {
        this.log = log;
        this.displayName = displayName;
        let serialRegex = /DYSON-(\w{3}-\w{2}-\w{8})-(\w{3})/;
        let [, id, model] = serialNumber.match(serialRegex) || [];
        if (!id || !model) {
            this.log.error("Incorrect serial number");
            this._valid = false;
        }

        else {
            this._id = id;
            this._model = model;
            this._valid = true;
            this._ip = ip;
            this._password = crypto.createHash('sha512').update(password, "utf8").digest("base64");
        }

        if (this.valid) {

            this.mqttEvent = new EventEmitter();
            this.environmentEvent = new EventEmitter();

            this.mqttClient = mqtt.connect("mqtt://" + this._ip, {
                username: this._id,
                password: this._password
            });

            this.statusSubscribeTopic = this._model + "/" + this._id + "/status/current";
            this.commandTopic = this._model + "/" + this._id + "/command";

            this.fanState = new DysonFanState(this.heatAvailable);
            this.environment = new DysonEnvironmentState();

            this.mqttClient.on('connect', () => {
                this.log.info("Connected to " + this._id + ". subscribe now");
                this.mqttClient.subscribe(this.statusSubscribeTopic);
            });

            this.mqttClient.on('message', (topic, message) => {
                this.log.info(message.toString());
                let result = JSON.parse(message);
                switch (result.msg) {
                    case "ENVIRONMENTAL-CURRENT-SENSOR-DATA":
                        this.log.info("Update sensor data");
                        this.environment.updateState(result);
                        this.environmentEvent.emit(this.SENSOR_EVENT);
                        break;
                    case "CURRENT-STATE":
                        this.log.info("Update fan data");
                        this.fanState.updateState(result);
                        this.mqttEvent.emit(this.STATE_EVENT);
                        break;
                }
            });
        }
    }



    requestForCurrentUpdate() {
        // Only do this when we have less than one listener to avoid multiple call        
        let senorlisternerCount = this.environmentEvent.listenerCount(this.SENSOR_EVENT);
        let fanlisternerCount = this.mqttEvent.listenerCount(this.STATE_EVENT);
        this.log.debug("Number of listeners: "+ senorlisternerCount + " " + fanlisternerCount);
        if(senorlisternerCount <=1 && fanlisternerCount <=1) {
            this.log("Request for current state update");
            this.mqttClient.publish(this.commandTopic, '{"msg":"REQUEST-CURRENT-STATE"}');
        }
    }

    setState(state) {
        let currentTime = new Date();
        let message = { msg: "STATE-SET", time: currentTime.toISOString(), data: state };
        this.log.info(this.displayName + " - Set State:" + state.toString());
        this.mqttClient.publish(this.commandTopic, JSON.stringify(message));
    }



    setFanState(value, callback) {
        switch (value) {
            case 0:
                this.setState({ fmod: "OFF" });
                break;
            case 1:
                this.setState({ hmod: "ON" });
                break;
            case 2:
                this.setState({ fmod: "ON" });
                break;
            case 3:
                this.setState({ fmod: "AUTO" });
                break;
        }

    }
    getFanState(callback) {
        this.mqttEvent.once(this.STATE_EVENT, () => {
            this.log.info(this.displayName + " - Fan State:" + this.fanState.fanState);
            callback(null, this.fanState.fanState);
        });
        // Request for udpate
        this.requestForCurrentUpdate();
    }

    setFanSpeed(value, callback) {
        this.setState({ fnsp: Math.round(value / 10) });
        this.getFanSpeed(callback);
    }

    getFanSpeed(callback) {
        this.mqttEvent.once(this.STATE_EVENT, () => {
            this.log.info(this.displayName + " - Fan Speed:" + this.fanState.fanSpeed);
            callback(null, this.fanSpeed);
        });
        // Request for udpate
        this.requestForCurrentUpdate();
    }

    setisNightMode(value, callback) {
        this.setState({ nmod: value ? "ON" : "OFF" });
        this.isNightMode(callback);
    }

    isNightMode(callback) {
        this.mqttEvent.once(this.STATE_EVENT, () => {
            this.log.info(this.displayName + " - Night Mode: " + this.fanState.nightMode);
            callback(null, this.fanState.nightMode);
        });
        // Request for udpate
        this.requestForCurrentUpdate();
    }

    setRotate(value, callback) {
        this.setState({ oson: value ? "ON" : "OFF" });
        this.isRotate(callback);
    }

    isRotate(callback) {
        this.mqttEvent.once(this.STATE_EVENT, () => {
            this.log.info(this.displayName + " - Fan Rotate: " + this.fanState.fanRotate);
            callback(null, this.fanState.fanRotate);
        });
        // Request for udpate
        this.requestForCurrentUpdate();
    }

    setHeatOn(value, callback) {
        this.setState({ hmod: value ? "ON" : "OFF" });
        this.isHeatOn(callback);
    }

    isHeatOn(callback) {
        this.mqttEvent.once(this.STATE_EVENT, () => {
            this.log.info(this.displayName + " - Heat On: " + this.fanState.fanHeat);
            callback(null, this.fanState.fanHeat);
        });
        // Request for udpate
        this.requestForCurrentUpdate();
    }

    setFanOn(value, callback) {
        this.setState({ fmod: value ? "FAN" : "OFF" });
        this.isFanOn(callback);
    }

    isFanOn(callback) {
        this.mqttEvent.once(this.STATE_EVENT, () => {
            this.log.info(this.displayName + " - Fan On: " + this.fanState.fanOn);
            callback(null, this.fanState.fanOn);
        });
        // Request for udpate
        this.requestForCurrentUpdate();
    }

    setFanAuto(value, callback) {
        this.setState({ fmod: value ? "AUTO" : "OFF" });
        this.isFanAuto(callback);
    }

    isFanAuto(callback) {
        this.mqttEvent.once(this.STATE_EVENT, () => {
            this.log.info(this.displayName + " - Fan Auto: " + this.fanState.fanAuto);
            callback(null, this.fanState.fanAuto);
        });
        // Request for udpate
        this.requestForCurrentUpdate();
    }

    getTemperture(callback) {
        this.log.debug(this.displayName + " Get temperture");
        if (this.notUpdatedRecently()) {
            this.environmentEvent.once(this.SENSOR_EVENT, () => {
                this.log.info(this.displayName + "- temperture new value: " + this.environment.temperature);
                // Wait until the update and return
                callback(null, this.environment.temperature);
            });
            // Request for udpate
            this.requestForCurrentUpdate();
        }
        else {
            this.log.info(this.displayName + "- temperture cached value: " + this.environment.temperature);
            callback(null, this.environment.temperature);
        }
    }

    getHumidity(callback) {
        this.log.debug(this.displayName + " Get humidity");
        if (this.notUpdatedRecently()) {
            this.environmentEvent.once(this.SENSOR_EVENT, () => {
                this.log.info(this.displayName + "- humidity new value: " + this.environment.humidity);
                // Wait until the update and return
                callback(null, this.environment.humidity);
            });
            // Request for udpate
            this.requestForCurrentUpdate();
        }
        else {
            this.log.info(this.displayName + "- humidity cached value: " + this.environment.humidity);
            callback(null, this.environment.humidity);
        }

    }

    getAirQuality(callback) {
        this.log.debug(this.displayName + " Get air quality");
        if (this.notUpdatedRecently()) {
            this.environmentEvent.once(this.SENSOR_EVENT, () => {
                this.log.info(this.displayName + " - air quality new value: " + this.environment.airQuality);
                // Wait until the update and return
                callback(null, this.environment.airQuality);
            });
            // Request for udpate
            this.requestForCurrentUpdate();
        }
        else {
            this.log.info(this.displayName + "- air quality cached value: " + this.environment.airQuality);
            callback(null, this.environment.airQuality);
        }

    }

    notUpdatedRecently() {
        let currentTime = new Date();
        return !this.environment.lastUpdated || (currentTime.getTime() - this.environment.lastUpdated.getTime()) > (60 * 1000);
    }

    get valid() { return this._valid; }
    get heatAvailable() { return this._model === "455"; }
}

module.exports = { DysonLinkDevice };