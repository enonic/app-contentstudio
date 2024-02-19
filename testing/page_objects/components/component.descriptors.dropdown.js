/**
 * Created on 30.01.2024
 */
const BasDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ComponentDescriptorsDropdown')]",
};

class ComponentDescriptorsDropdown extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredComponentAndClickOnOk(displayName, parentElement) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(displayName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Component Descriptors Dropdown - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = ComponentDescriptorsDropdown;
