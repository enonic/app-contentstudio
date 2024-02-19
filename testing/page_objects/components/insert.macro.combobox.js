/**
 * Created on 16.02.2024
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: "//div[contains(@id,'MacroComboBox')]",
    contentListBoxUL: "//ul[contains(@id,'ContentListBox')]",
    contentListItemLI: "//li[contains(@class,'item-view-wrapper')]",
};

class MacroComboBox extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredAndClickOnOk(displayName, parent) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(displayName, parent);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Content selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = MacroComboBox;
