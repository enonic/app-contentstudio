/**
 * Created on 08.01.2024
 */
const lib = require('../../../libs/elements-old');
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
            await this.handleError(`Page descriptor selector -  controller: ${controllerDisplayName}`, 'err_page_controller_dropdown', err);
        }
    }
}

module.exports = PageDescriptorDropdown;
