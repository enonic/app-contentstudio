/**
 * Created on 28.12.2017. updated on 24.04.2026
 */
const OccurrencesFormView = require('./occurrences.form.view');
const {COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

class TextAreaForm extends OccurrencesFormView {

    get textAreaInput() {
        return COMMON.INPUTS.DATA_COMPONENT_INPUT_FIELD + COMMON.INPUTS.TEXTAREA;
    }

    async typeText(value,index) {
        index = typeof index !== 'undefined' ? index : 0;
        let inputs = await this.getDisplayedElements(this.textAreaInput);
        for (const ch of String(value)) {
            await inputs[index].addValue(ch);
        }
        return await this.pause(300);
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.validationRecord, appConst.shortTimeout);
    }
}

module.exports = TextAreaForm;
