/**
 * Created on 08.01.2024
 */
const BasDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ContentMoveComboBox')]",
};

class ContentMoveComboBox extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredContentAndClickOnOk(displayName, parent) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(displayName, parent);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Error occurred in Content Move combobox, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = ContentMoveComboBox;
