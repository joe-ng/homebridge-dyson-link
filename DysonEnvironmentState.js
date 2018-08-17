class DysonEnvironmentState {

    updateState(newState) {

        this._lastUpdated = new Date(newState.time);

        // Gets all possible values from the data (depending on the model)
        this._pm2_5Density = this.getNumericValue(newState.data.p25r);
        this._pm10Density = this.getNumericValue(newState.data.p10r);
        this._vocDensity = this.getNumericValue(newState.data.va10);
        this._nitrogenDioxideDensity = this.getNumericValue(newState.data.noxl);
        let p = this.getCharacteristicValue(newState.data.pact);
        let v = this.getCharacteristicValue(newState.data.vact);

        // Gets the highest value, which means the one with the baddest results
        this._airQuality = Math.max(
            this.getCharacteristicValue(newState.data.pm25), 
            this.getCharacteristicValue(newState.data.pm10),
            this.getCharacteristicValue(newState.data.va10),
            this.getCharacteristicValue(newState.data.noxl),
            p, v);
        
        this._humidity = Number.parseInt(newState.data.hact);
        // Reference: http://aakira.hatenablog.com/entry/2016/08/12/012654
        this._temperature = Number.parseFloat(newState.data.tact) / 10 - 273;
    }

    getNumericValue(rawValue) {

        // Converts the raw value into an integer
        if (!rawValue) {
            return 0;
        }
        return Number.parseInt(rawValue);
    }

    getCharacteristicValue(rawValue) {

        // Converts the raw value into an integer (if no value is provided, 0 is returned, so that the overall result is not changed)
        if (!rawValue) {
            return 0;
        }
        let integerValue = Number.parseInt(rawValue);

        // Reduces the scale from 0-100 to 0-10 as used in the Dyson app
        integerValue = Math.floor(integerValue / 10);

        // Returns the characteristic value based on the bucket in which the value should go (as seen in the Dyson app)
        if (integerValue <= 3) {
            return 2; // Characteristic.AirQuality.GOOD
        }
        if (integerValue <= 6) {
            return 3; // Characteristic.AirQuality.FAIR
        }
        if (integerValue <= 8) {
            return 4; // Characteristic.AirQuality.INFERIOR
        }
        return 5; // Characteristic.AirQuality.POOR
    }

    get lastUpdated() {return this._lastUpdated;}
    get airQuality() {return this._airQuality;}
    get pm2_5Density() {return this._pm2_5Density;}
    get pm10Density() {return this._pm10Density;}
    get vocDensity() {return this._vocDensity;}
    get nitrogenDioxideDensity() {return this._nitrogenDioxideDensity;}
    get humidity() {return this._humidity;}
    get temperature() {return this._temperature;}

}

module.exports = { DysonEnvironmentState };