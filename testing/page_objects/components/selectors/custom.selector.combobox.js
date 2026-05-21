/**
 * Created on 20.02.2024  updated on 21.05.2026
 */
const BaseDropdown = require('./base.dropdown');
const {DROPDOWN, BUTTONS} = require('../../../libs/elements');

const XPATH = {
    selectionItemDisplayName: "//div[@data-component='SortableGridList']//div[@data-component='ItemLabel']/div/span[contains(@class,'font-semibold')]",
};

class CustomSelectorComboBox extends BaseDropdown {

    constructor(parentElementXpath) {
        super();
        this._container = parentElementXpath;
    }

    // returns the element that contains the dropdown:
    get container() {
        return this._container;
    }

    optionsFilterInput() {
        return this.dataComponentDiv + DROPDOWN.OPTION_FILTER_INPUT;
    }

    get dataComponentDiv() {
        return "//div[@data-component='CustomSelectorInput']";
    }

    async selectFilteredOptionAndClickOnApply(optionName) {
        try {
            await this.doFilterItem(optionName);
            await this.clickOnOptionByDisplayName(optionName);
            await this.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(`CustomSelectorComboBox, tried to click on the option, ${optionName} `, 'err_dropdown', err);
        }
    }

    async getSelectedOptionsName() {
        const locator = this.container + XPATH.selectionItemDisplayName;
        return await this.getTextInDisplayedElements(locator);
    }

    // Options in the dropdown list:
    async getOptionsName() {
        const locator = DROPDOWN.COMBOBOX_POPUP + "//div[@data-component='Listbox.Item']//span[contains(@class,'font-semibold')]";
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = CustomSelectorComboBox;
