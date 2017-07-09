"use strict";

const mqtt = require('mqtt');
const crypto = require('crypto');
const EventEmitter = require("events").EventEmitter;



class DysonLinkDevice
{
    static get SENSOR_EVENT() { return "sensor-updated"; }
    static get STATE_EVENT() { return "state-updated"; }

    constructor(ip, serialNumber, password, log) {
        this.log = log;
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
            this.lastUpdated = new Date();
            this.mqttEvent = new EventEmitter();

            this.mqttClient = mqtt.connect("mqtt://" + this._ip, {
                username: this._id,
                password: this._password
            });

            this.statusSubscribeTopic = this._model + "/" + this._id+"/status/current";
            this.commandTopic = this._model + "/" + this._id + "/command";

            this.mqttClient.on('connect', () => {
                this.log.info("connected to dyson. subscribe now");
                this.mqttClient.subscribe(this.statusSubscribeTopic);
            });

            this.mqttClient.on('message', (topic, message) => {
                this.log.info(message.toString());
                let result = JSON.parse(message);
                if (result.msg == "ENVIRONMENTAL-CURRENT-SENSOR-DATA") {
                    this.lastUpdated = new Date(result.time);
                    this.airQuality = Math.min(Math.max(Math.floor((parseInt(result.data.pact) + parseInt(result.data.vact)) / 2), 1), 5);
                    this.humidity = Number.parseInt(result.data.hact);
                    this.temperature = Number.parseFloat(result.data.tact) / 10 / 10;
                    this.mqttEvent.emit(this.SENSOR_EVENT);
                }
                else if (result.msg == "CURRENT-STATE") {
                    this.fan = result["product-state"]["fmod"] === "ON";
                    this.auto = result["product-state"]["fmod"] === "AUTO";
                    this.rotate = result["product-state"]["oson"] === "ON";
                    this.rotateSpeed = Number.parseInt(result["product-state"]["fnsp"]) * 10;
                    this.mqttEvent.emit(this.STATE_EVENT);
                }
            });
        }
    }



    requestForCurrentUpdate() {
        this.mqttClient.publish(this.commandTopic, '{"msg":"REQUEST-CURRENT-STATE"}');
    }

    setState(state) {
        let currentTime = new Date();
        let message = { msg: "STATE-SET", time: currentTime.toISOString(), data: state };
        this.mqttClient.publish(this.commandTopic, JSON.stringify(message));
    }

    setRotateSpeed(value, callback) {
        setState({ fnsp: Math.round(value /10) });
        this.isRotate(callback);
    }

    getRotateSpeed(callback) {
        this.mqttEvent.once(this.STATE_EVENT,  () => {
            callback(null, this.rotateSpeed);
        });
        // Request for udpate
        this.requestForCurrentUpdate();
    }

    setRotate(value, callback) {
        setState({ oson: value ? "ON" : "OFF" });
        this.isRotate(callback);
    }

    isRotate(callback) {
        this.mqttEvent.once(this.STATE_EVENT, () =>  {
            callback(null, this.rotate);
        });
        // Request for udpate
        this.requestForCurrentUpdate();
    }

    setFanOn(value, callback) {
        setState({ fmod: value ? "FAN" : "OFF" });
        this.isFanOn(callback);
    }

    isFanOn(callback) {
        this.mqttEvent.once(this.STATE_EVENT, () =>  {
            callback(null, this.fan);
        });
        // Request for udpate
        this.requestForCurrentUpdate();
    }

    setFanAuto(value, callback) {
        setState({ fmod: value ? "AUTO" : "OFF" });
        this.isFanAuto(callback);
    }

    isFanAuto(callback) {
        this.mqttEvent.once(this.STATE_EVENT, () =>  {
            callback(null, this.auto);
        });
        // Request for udpate
        this.requestForCurrentUpdate();
    }

    getTemperture(callback) {
        let currentTime = new Date();        
        if ((currentTime.getTime() - this.lastUpdated.getTime()) > (60 * 1000)) {
            this.mqttEvent.once(this.SENSOR_EVENT, () => {
                // Wait until the update and return
                callback(null, this.temperature);
            });
            // Request for udpate
            this.requestForCurrentUpdate();
        }
        else {
            callback(null, this.temperature);
        }
    }

    getHumidity() {
        let currentTime = new Date();
        if ((currentTime.getTime() - this.lastUpdated.getTime()) > (60 * 1000)) {
            this.mqttEvent.once(this.SENSOR_EVENT, () => {
                // Wait until the update and return
                callback(null, this.humidity);
            });
            // Request for udpate
            this.requestForCurrentUpdate();
        }
        else {
            callback(null, this.humidity);
        }

    }

    getAirQuality() {
        let currentTime = new Date();
        if ((currentTime.getTime() - this.lastUpdated.getTime()) > (60 * 1000)) {
            this.mqttEvent.once(this.SENSOR_EVENT, () =>  {
                // Wait until the update and return
                callback(null, this.airQuality);
            });
            // Request for udpate
            this.requestForCurrentUpdate();
        }
        else {
            callback(null, this.airQuality);
        }

    }

    get valid() { return this._valid; }
}

module.exports = { DysonLinkDevice };