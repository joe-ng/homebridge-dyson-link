class DysonEnvironmentState {

    constructor() {

    }

    updateState(newState) {

        this._lastUpdated = new Date(newState.time);

        // From HAP, The value property of AirQuality must be one of the following:
        /*
        Characteristic.AirQuality.UNKNOWN = 0;
        Characteristic.AirQuality.EXCELLENT = 1;
        Characteristic.AirQuality.GOOD = 2;
        Characteristic.AirQuality.FAIR = 3;
        Characteristic.AirQuality.INFERIOR = 4;
        Characteristic.AirQuality.POOR = 5;
        */
        // Current calculation = (dust value + voc value) /2 and cap that between 1 to 5
        this._airQuality = Math.min(Math.max(Math.floor((parseInt(newState.data.pact) + parseInt(newState.data.vact)) / 2), 1), 5);
        this._humidity = Number.parseInt(newState.data.hact);
        // Reference: http://aakira.hatenablog.com/entry/2016/08/12/012654
        this._temperature = Number.parseFloat(newState.data.tact) / 10 - 273;
    }

    get lastUpdated() {return this._lastUpdated;}
    get airQuality() {return this._airQuality;}
    get humidity() {return this._humidity;}
    get temperature() {return this._temperature;}

}

module.exports = { DysonEnvironmentState };