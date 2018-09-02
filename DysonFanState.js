class DysonFanState {
 
    constructor(heatAvailable, is2018Dyson) {
        this.heatAvailable = heatAvailable;
        this.is2018Dyson = is2018Dyson;
    }
 
    getFieldValue(newState, field) {
        var state = newState["product-state"];
        if(state instanceof Object)
        {
            return state[field];
        }
        else
        {
            return newState[field];
        }
    }
 
    updateState(newState) {
        this._fan = this.getFieldValue(newState, "fmod") === "FAN" ||
                    this.getFieldValue(newState, "fmod") === "AUTO" ||
                    this.getFieldValue(newState, "fpwr") === "ON" ;
 
        this._auto = this.getFieldValue(newState, "fmod") === "AUTO" ||
                    (this.getFieldValue(newState, "auto") === "ON" && this._fan);
 
        this._rotate = this.getFieldValue(newState, "oson") === "ON";
        this._nightMode = this.getFieldValue(newState, "nmod") === "ON" ? false : true;        
        this._speed = (Number.parseInt(this.getFieldValue(newState, "fnsp"))||5) * 10;
        if (this.heatAvailable) {
            this._heat = this.getFieldValue(newState, "hmod") === "HEAT";
            this._focus = this.getFieldValue(newState, "ffoc") === "ON";
            this._heatThreshold = Number.parseFloat(this.getFieldValue(newState, "hmax")) /10 - 273;
        } 
        if( this.is2018Dyson){
            this._focus = this.getFieldValue(newState, "fdir") === "ON";
        }
        // this._fanState = 0;
        // if (this._auto) {
        //     this._fanState = 3;
        // }
        // else if (this._fan) {
        //     this._fanState = 2;
        // }
        // else if (this.heatAvailable && this._heat) {
        //     this._fanState = 1;
        // }
        // With TP04 models average cflr and hflr
        let filterReading = this.getFieldValue(newState, "filf") ||
            (this.getFieldValue(newState, "cflr") + this.getFieldValue(newState, "hflr"))/2;
        // Assuming the max life is 12 * 365 = 4380 hrs
        this._filterLife = Number.parseInt(filterReading) * 100 / 4380;
        // Set to chang the filter when the life is below 10%
        this._filterChange = this._filterLife <10 ;
        // The value property of CurrentHeaterCoolerState must be one of the following:
        // Characteristic.CurrentHeaterCoolerState.INACTIVE = 0;
        // Characteristic.CurrentHeaterCoolerState.IDLE = 1;
        // Characteristic.CurrentHeaterCoolerState.HEATING = 2;
        // Characteristic.CurrentHeaterCoolerState.COOLING = 3;
        switch(this.getFieldValue(newState, "fmod")||this.getFieldValue(newState, "fpwr")){
            case "OFF":
                this._currentHeaterCoolerState = 0;
                break;
            case "AUTO":
            case "ON":
            case "FAN":
                this._currentHeaterCoolerState = 3;
                break;
        }
        if(this._fan){
            this._targetHeaterCoolerState = 2;
        }
        if (this.heatAvailable && this._heat){
            this._currentHeaterCoolerState = 2;            
            this._targetHeaterCoolerState = 1;
        }
        if(this._auto) {
            this._targetHeaterCoolerState = 0;
        }
    }
 
    get fanOn() { return this._fan; }
    get fanAuto() {return this._auto;}
    get fanRotate() {return this._rotate;}
    get fanSpeed() {return this._speed;}
    get fanHeat() {return this._heat;}
    get fanState() {return this._fanState;}
    get nightMode() {return this._nightMode;}
    get fanFocused() {return this._focus;}
    get filterLife() {return this._filterLife;}
    get filterChangeRequired() {return this._filterChange;}
    get heaterCoolerState() { return this._currentHeaterCoolerState; }
    get targetHeaterCoolerState() { return this._targetHeaterCoolerState;}
    get heatThreshold() { return this._heatThreshold;}
}
 
module.exports = { DysonFanState };
