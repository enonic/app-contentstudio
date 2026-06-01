/**
 * Created on 30.01.2024 updated on 01.06.2026
 */
const BasDropdown = require('./base.dropdown');
const {DROPDOWN} = require("../../../libs/elements");
const XPATH = {
    container: "//div[@data-component='ComponentDescriptorSelector']",
    descriptorListBoxUL: "//ul[contains(@id,'DescriptorListBox')]",
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
        return this.container  + DROPDOWN.OPTION_FILTER_DATA_COMPONENT;
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

    async getOptionsDisplayName() {
        const locator = DROPDOWN.COMBOBOX_POPUP + "//div[@data-component='Listbox.Item']//span[contains(@class,'font-semibold')]";
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = ComponentDescriptorsDropdown;
