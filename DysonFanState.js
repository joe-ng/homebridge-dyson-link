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
        }
        this._fanState = 0;
        if (this.auto) {
            this._fanState = 3;
        }
        else if (this.fan) {
            this._fanState = 2;
        }
        else if (this.heatAvailable && this.heat) {
            this._fanState = 1;
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

}

module.exports = { DysonFanState };