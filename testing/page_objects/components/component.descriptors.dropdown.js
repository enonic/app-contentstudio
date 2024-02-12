/**
 * Created on 30.01.2024
 */
const BasDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ContentTreeSelectorDropdown')]",
};

class ComponentDescriptorsDropdown extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredContentAndClickOnOk(displayName) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(displayName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Content selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = ComponentDescriptorsDropdown;
