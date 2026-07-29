/**
 * Created on 30.01.2024 updated on 01.06.2026
 */
const BasDropdown = require('./base.dropdown');
const {DROPDOWN} = require("../../../libs/elements");
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[@data-component='ComponentDescriptorSelector']",
    listboxOptionByDisplayName: displayName =>
        `//div[@role='listbox']//div[@data-component='Listbox.Item' and @role='option' and descendant::span[contains(@class,'font-semibold') and text()='${displayName}']]`,
    LISTBOX_OPTIONS_DISPLAY_NAME: "//div[@role='listbox']//div[@data-component='Listbox.Item' and @role='option']//span[contains(@class,'font-semibold')]",
};

class ComponentDescriptorsDropdown extends BasDropdown {

    constructor(parentElementXpath) {
        super();
        this._parent = parentElementXpath;
    }

    get dataComponentDiv() {
        return "//div[@data-component='ComponentInspectionPanel']";
    }

    optionsFilterInput() {
        return this.container + DROPDOWN.OPTION_FILTER_DATA_COMPONENT;
    }

    get container() {
        return this._parent + XPATH.container;
    }

    async selectFilteredComponent(displayName) {
        try {
            await this.doFilterItem(displayName);
            await this.clickOnOptionByDisplayName(displayName);
        } catch (err) {
            await this.handleError(`Content selector, tried to click on the filtered option, ${displayName} `, 'err_content_sel', err);
        }
    }

    // clicks on an option('Listbox.Item') in the expanded listbox, hidden listboxes are filtered out:
    async clickOnOptionByDisplayName(displayName) {
        try {
            let optionLocator = XPATH.listboxOptionByDisplayName(displayName);
            await this.waitUntilDisplayed(optionLocator, appConst.mediumTimeout);
            let elements = await this.getDisplayedElements(optionLocator);
            await elements[0].click();
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Descriptors dropdown, tried to click on the option: ${displayName}`,
                'err_click_descriptor_option', err);
        }
    }

    async getOptionsDisplayName() {
        const locator = XPATH.LISTBOX_OPTIONS_DISPLAY_NAME;
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        await this.pause(200);
        return await this.getTextInDisplayedElements(locator);
    }

    // returns the display name of the selected option in the collapsed combobox('Combobox.Value' button):
    async getSelectedOption() {
        let locator = this.container + DROPDOWN.COMBOBOX_VALUE;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = ComponentDescriptorsDropdown;
