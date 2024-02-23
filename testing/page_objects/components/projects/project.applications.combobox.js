/**
 * Created on 22.02.2024
 */
const BasDropdown = require('../base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ProjectApplicationsComboBox')]",
};

// Applications Step wizard( or form panel) - select an application in the dropdown selector
class ProjectApplicationsCombobox extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async clickFilteredByAppNameItemAndClickOnOk(appDisplayName, parentElement) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(appDisplayName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Error occurred in Project Applications Comboboox selector, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = ProjectApplicationsCombobox;
