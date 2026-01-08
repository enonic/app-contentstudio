/**
 * Created on 08.10.2021
 */
const OccurrencesFormView = require('./occurrences.form.view');
const lib = require('../../libs/elements-old');
const XPATH = {
    container: "//div[contains(@id,'GeoPoint')]",
    locationInput: "//input[contains(@id,'GeoPoint') and @placeholder='latitude,longitude']",
    occurrenceErrorBlock: `//div[contains(@id,'InputOccurrenceView')]//div[contains(@class,'error-block')]`,
    occurrenceView: "//div[contains(@id,'InputOccurrenceView')]",
};

class GeoPointForm extends OccurrencesFormView {

    get geoLocationInput() {
        return XPATH.container + XPATH.locationInput;
    }

    get removeInputButton() {
        return XPATH.container + XPATH.occurrenceView + lib.REMOVE_BUTTON_2;
    }

    async typeGeoPoint(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let locationElements = await this.getDisplayedElements(this.geoLocationInput);
        await locationElements[index].setValue(value);
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
        let removeButtons = await this.getDisplayedElements(this.removeInputButton);
        if (removeButtons.length === 0) {
            throw new Error("Geo Point Form - Remove buttons were not found!");
        }
        await removeButtons[index].click();
        return await this.pause(500);
    }
}

module.exports = GeoPointForm;
