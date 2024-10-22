/**
 * Created on 08.01.2024
 */
const BaseDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'ContentMoveComboBox')]",
};

class ContentMoveComboBox extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredContent(displayName, parent) {
        try {
            await this.clickOnFilteredByDisplayNameItem(displayName, parent);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Error occurred in Content Move combobox, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = ContentMoveComboBox;
