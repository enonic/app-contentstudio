/**
 * Created on 08.01.2024
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const BaseDropdown = require('./base.dropdown');
const XPATH = {
    container: "//div[contains(@id,'PageDescriptorDropdown')]",
};

class PageDescriptorDropdown extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredControllerAndClickOnOk(controllerDisplayName) {
        try {
            await this.clickOnFilteredByDisplayNameItem(controllerDisplayName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error(`Page descriptor selector - Error during selecting the option, screenshot: ${screenshot} ` + err);
        }
    }
}

module.exports = PageDescriptorDropdown;
