const BaseSiteConfiguratorDialog = require('./base.site.configurator.dialog');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[@data-component='Dialog.Content']`,
    // v6 Checkbox: the visible label holds the option text, the input itself is visually hidden (sr-only):
    optionLabelLocator: option => `//div[@data-component='Checkbox' and descendant::span[text()='${option}']]//label`,
    optionCheckboxLocator: option => `//div[@data-component='Checkbox' and descendant::span[text()='${option}']]//input[@type='checkbox']`,
};

class SiteConfiguratorWitOptionSetDialog extends BaseSiteConfiguratorDialog {

    async clickOnOption(option) {
        let locator = XPATH.container + XPATH.optionLabelLocator(option);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(300);
    }

    // Returns the state of the checkbox for the option ('Option 1', 'Option 2'...):
    async isCheckboxSelected(option) {
        let labelLocator = XPATH.container + XPATH.optionLabelLocator(option);
        await this.waitForElementDisplayed(labelLocator, appConst.mediumTimeout);
        return await this.isSelected(XPATH.container + XPATH.optionCheckboxLocator(option));
    }
}

module.exports = SiteConfiguratorWitOptionSetDialog;
