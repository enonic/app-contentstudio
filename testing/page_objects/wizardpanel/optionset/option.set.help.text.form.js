/**
 * Created on 17.03.2022
 */
const OptionSetFormView = require('./optionset.form.view');
const {COMMON} = require('../../../libs/elements');


class OptionSetHelpFormView extends OptionSetFormView {

    async getHelpText(inputLabel) {
        try {
            let locator = COMMON.INPUTS.inputFieldByLabel(inputLabel) +
                          "//div[@data-component='InputLabel']//div[contains(@class,'text-subtle')]";
            await this.waitForElementDisplayed(locator);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`getting help-text for ${inputLabel} input:`, 'err_help_text', err);
        }
    }
}

module.exports = OptionSetHelpFormView;
