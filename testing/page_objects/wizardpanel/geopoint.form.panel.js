/**
 * Created on 08.10.2021 updated on 20.03.2026
 */
const OccurrencesFormView = require('./occurrences.form.view');
const {COMMON} = require('../../libs/elements');

const XPATH = {
    dataComponentGeoPointInput: "//div[@role='button']//input[@data-component='GeoPointInput'] | //input[@data-component='GeoPointInput' and not(ancestor::div[@role='button'])]",
};

class GeoPointForm extends OccurrencesFormView {

    get geoLocationInput() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + XPATH.dataComponentGeoPointInput;
    }

    get removeGeoPointInputButton() {
        return this.removeButton;
    }

    async typeInGeoPointInput(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let locationElements = await this.getDisplayedElements(this.geoLocationInput);
        for (const ch of value) {
            await locationElements[index].addValue(ch);
        }
        return await this.pause(300);
    }

    async getValueInGeoPoint(index) {
        index = typeof index !== 'undefined' ? index : 0;
        let locationElements = await this.getDisplayedElements(this.geoLocationInput);
        return await locationElements[index].getValue();
    }

    getNumberOfInputs() {
        return this.getDisplayedElements(this.geoLocationInput);
    }

    async isInvalidValue(index) {
        let inputs = await this.getDisplayedElements(this.geoLocationInput);
        if (inputs.length === 0) {
            throw new Error("Geo Point Form - Geo location inputs were not found!");
        }
        let attr = await inputs[index].getAttribute('class');
        return attr.includes('invalid');
    }

    async clickOnRemoveIcon(index) {
        let removeButtons = await this.getDisplayedElements(this.removeGeoPointInputButton);
        if (removeButtons.length === 0) {
            throw new Error("Geo Point Form - Remove buttons were not found!");
        }
        await removeButtons[index].click();
        return await this.pause(500);
    }
}

module.exports = GeoPointForm;
