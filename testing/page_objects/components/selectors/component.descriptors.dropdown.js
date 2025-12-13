/**
 * Created on 30.01.2024
 */
const BasDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const XPATH = {
    container: "//div[contains(@id,'ComponentDescriptorsDropdown')]",
    descriptorListBoxUL: "//ul[contains(@id,'DescriptorListBox')]",
};

class ComponentDescriptorsDropdown extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredComponent(displayName, parentElement) {
        try {
            await this.clickOnFilteredByDisplayNameItem(displayName, parentElement);
        } catch (err) {
            await this.handleError('Tried to select the option in Component Descriptors Dropdown', 'err_select_component_descriptor', err);
        }
    }

    async getOptionsDisplayName(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.descriptorListBoxUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(300);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = ComponentDescriptorsDropdown;
