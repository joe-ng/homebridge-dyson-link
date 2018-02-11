class DysonFanState {

    constructor(heatAvailable) {
        this.heatAvailable = heatAvailable;

    }

    updateState(newState) {
        this._fan = newState["product-state"]["fmod"] === "FAN" || newState["product-state"]["fmod"] === "AUTO";
        this._auto = newState["product-state"]["fmod"] === "AUTO";
        this._rotate = newState["product-state"]["oson"] === "ON";
        this._nightMode = newState["product-state"]["nmod"] === "ON";        
        this._speed = Number.parseInt(newState["product-state"]["fnsp"]) * 10;
        if (this.heatAvailable) {
            this._heat = newState["product-state"]["hmod"] === "HEAT";
            this._focus = newState["product-state"]["ffoc"] === "ON";
            this._heatThreshold = Number.parseFloat(newState["product-state"]["hmax"]) /10 - 273;
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
        // Assuming the max life is 12 * 365 = 4380 hrs
        this._filterLife = Number.parseInt(newState["product-state"]["filf"]) * 100 / 4380;
        // Set to chang the filter when the life is below 10%
        this._filterChange = this._filterLife <10 ;

        // The value property of CurrentHeaterCoolerState must be one of the following:
        // Characteristic.CurrentHeaterCoolerState.INACTIVE = 0;
        // Characteristic.CurrentHeaterCoolerState.IDLE = 1;
        // Characteristic.CurrentHeaterCoolerState.HEATING = 2;
        // Characteristic.CurrentHeaterCoolerState.COOLING = 3;
        switch( newState["product-state"]["fmod"]){
            case "OFF":
                this._currentHeaterCoolerState = 0;
                break;
            case "AUTO":            
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