/**
 * Created on 12.02.2024
 */
const BasDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'CSPrincipalCombobox')]",
};

class PrincipalComboBox extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredUserAndClickOnOk(userDisplayName, parentElement) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(userDisplayName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Principal Comboboox selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = PrincipalComboBox;
