/**
 * Created on 25.12.2017.
 */
const OccurrencesFormView = require('./occurrences.form.view');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    longInput: "//div[contains(@id,'Long') and contains(@class,'input-type-view')]",
    occurrenceErrorBlock: `//div[contains(@id,'InputOccurrenceView')]//div[contains(@class,'error-block')]`,
    inputValidationView: "//div[contains(@id,'InputViewValidationViewer')]",
    addButton: "//div[@class='bottom-button-row']//button[child::span[text()='Add']]",
};

class LongForm extends OccurrencesFormView {

    get longInput() {
        return lib.FORM_VIEW + XPATH.longInput + lib.TEXT_INPUT;
    }

    //get values in occurrences of inputs
    async getLongValues() {
        let values = [];
        let longElements = await this.getDisplayedElements(this.longInput);
        await Promise.all(longElements.map(async (el) => {
            const value = await el.getValue();
            values.push(value);
        }));
        return values;
    }

    async typeLong(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let longElements = await this.getDisplayedElements(this.longInput);
        await longElements[index].setValue(value);
        return await this.pause(300);
    }
}

module.exports = LongForm;
