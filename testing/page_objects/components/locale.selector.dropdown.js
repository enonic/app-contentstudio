/**
 * Created on 29.01.2024
 */
const BasDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'LocaleComboBox')]",
};

class LocaleSelectorDropdown extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async clickOnFilteredLanguageAndClickOnOk(language) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(language);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Content selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = LocaleSelectorDropdown;
