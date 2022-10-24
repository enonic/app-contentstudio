/**
 * Created on 25.12.2017.
 */

const OccurrencesFormView = require('./occurrences.form.view');
const lib = require('../../libs/elements');
const XPATH = {
    doubleInput: `//div[contains(@id,'Double')]`,
    occurrenceErrorBlock: `//div[contains(@id,'InputOccurrenceView')]//div[contains(@class,'error-block')]`,
    occurrenceView: "//div[contains(@id,'InputOccurrenceView')]",
};

class DoubleForm extends OccurrencesFormView {

    get doubleInput() {
        return lib.FORM_VIEW + XPATH.doubleInput + lib.TEXT_INPUT;
    }

    get removeInputButton() {
        return XPATH.doubleInput + XPATH.occurrenceView + lib.REMOVE_BUTTON_2;
    }

    async typeDouble(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let doubleElements = await this.getDisplayedElements(this.doubleInput);
        await doubleElements[index].setValue(value);
        return await this.pause(300);
    }

    getNumberOfInputs() {
        return this.getDisplayedElements(this.doubleInput);
    }

    async isInvalidValue(index) {
        let inputs = await this.getDisplayedElements(this.doubleInput);
        if (inputs.length === 0) {
            throw new Error("Double Form - Double inputs were not found!");
        }
        let attr = await inputs[index].getAttribute("class");
        return attr.includes("invalid");
    }

    async clickOnRemoveIcon(index) {
        let removeButtons = await this.getDisplayedElements(this.removeInputButton);
        if (removeButtons.length === 0) {
            throw new Error("Double Form - Remove buttons were not found!");
        }
        await removeButtons[index].click();
        return await this.pause(500);
    }

    async waitForRedBorderInDoubleInput(index) {
        try {
            return await this.waitForRedBorderInInput(index, this.doubleInput);
        } catch (err) {
            await this.saveScreenshot("err_red_border_double");
            throw new Error(err);
        }
    }

    async waitForRedBorderNotDisplayedInDoubleInput(index) {
        try {
            return await this.waitForRedBorderNotDisplayedInInput(index, this.doubleInput);
        } catch (err) {
            await this.saveScreenshot("err_red_border_double_displayed");
            throw new Error(err);
        }
    }
}

module.exports = DoubleForm;
