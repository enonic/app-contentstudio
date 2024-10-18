/**
 * Created on 29.01.2024
 */
const BasDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'SiteConfiguratorComboBox')]",
};

class SiteConfiguratorComboBox extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredApplicationAndClickOnApply(appDisplayName, parentElement) {
        try {
            await this.clickOnFilteredByDisplayNameItemAndClickOnApply(appDisplayName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('SiteConfigurator  - Error occurred during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = SiteConfiguratorComboBox;
