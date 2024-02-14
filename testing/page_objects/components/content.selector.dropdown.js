/**
 * Created on 08.01.2024
 */
const BasDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ContentSelector')]",
};

class ContentSelectorDropdown extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredContentAndClickOnOk(displayName, parent) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(displayName, parent);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Content selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = ContentSelectorDropdown;
