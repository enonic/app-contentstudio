/**
 * Created on 23.01.2019. updated on 12.06.2026
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const {COMMON} = require('../../../libs/elements');

const xpath = {
    singleSelectionSetView: "//div[@data-component='OptionSetView' and child::div[@data-component='SetHeader']//span[text()='Single selection']]",
};

class OptionSetFormView extends Page {

    // Clicks on a radio button('Option 1', 'Option 2') in the 'Single selection' option set:
    async selectOptionInSingleSelection(optionDisplayName) {
        try {
            let locator = xpath.singleSelectionSetView + COMMON.INPUTS.dataComponentRadioByLabel(optionDisplayName);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Option Set - single selection, option '${optionDisplayName}'`, 'err_optionset', err);
        }
    }
}

module.exports = OptionSetFormView;
