/**
 * Created on 12.02.2024
 */
const BasDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'AccessControlComboBox')]",
};

class AccessControlCombobox extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredPrincipalAndClickOnApply(principal, parentElement) {
        try {
            await this.clickOnFilteredByDisplayNameItemAndClickOnApply(principal, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error(`AccessControlComboBox selector - Error during selecting the option, screenshot: ${screenshot} ` + err);
        }
    }
}

module.exports = AccessControlCombobox;
