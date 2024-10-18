/**
 * Created on 16.02.2024
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const XPATH = {
    container: "//div[contains(@id,'MacroComboBox')]",
    contentListBoxUL: "//ul[contains(@id,'ContentListBox')]",
};

class MacroComboBox extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredByDisplayNameItem(displayName, parent) {
        try {
            await this.clickOnFilteredByDisplayNameItem(displayName, parent);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Macro selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = MacroComboBox;
