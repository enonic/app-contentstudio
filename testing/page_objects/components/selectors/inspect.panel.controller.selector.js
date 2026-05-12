/**
 * Created on 23.02.2024
 */
const BaseDropdown = require('./base.dropdown');

const {DROPDOWN} = require("../../../libs/elements");

const xpath = {
    dataComponent: "//div[@data-component='PageControllerSelector']",
};

class InspectPanelControllerSelector extends BaseDropdown {

    constructor(parentElementXpath) {
        super();
        this._parentContainer = parentElementXpath;
    }

    get container() {
        return this._parentContainer
    }

    get dataComponentDiv() {
        return xpath.dataComponent;
    }

    optionsFilterInput() {
        return this.container + DROPDOWN.OPTION_FILTER_INPUT;
    }

    async getSelectedOption(){
        let locator = this.container + "//button[@data-component='Combobox.Value']/span";
        await this.waitForElementDisplayed(locator);
        return await this.getText(locator);
    }

    async clickOnOptionByDisplayName(optionDisplayName) {
        try {
            let optionLocator = DROPDOWN.listboxOptionByText(optionDisplayName);
            await this.waitForElementDisplayed(optionLocator);
            await this.clickOnElement(optionLocator);
        } catch (err) {
            await this.handleError(`Dropdown Selector, tried to click on filtered by display name option: ${optionDisplayName}`,
                'err_click_filtered_option', err);
        }
    }


    async getOptionsDescription(){
        const locator = DROPDOWN.COMBOBOX_POPUP + "//div[@data-component='Listbox.Item' and @role='option']//small";
        await this.waitForElementDisplayed(locator);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsName(){
        const locator = DROPDOWN.COMBOBOX_POPUP + "//div[@data-component='Listbox.Item' and @role='option']//span";
        await this.waitForElementDisplayed(locator);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async selectFilteredOptionByDisplayName(optionName) {
        try {
            await this.clickOnDropdownHandle();
            await this.clickOnOptionByDisplayName(optionName );
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('CustomSelectorComboBox - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = InspectPanelControllerSelector;
