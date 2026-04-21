/**
 * Created on 15.02.2024
 */
const BasDropdown = require('./base.dropdown');
const XPATH = {
    dataComponent: "//div[@data-component='ComboBoxInput']",
    comboBoxListInput: "//div[contains(@id,'ComboBoxListInput')]",
    listItemViewer: "//div[contains(@id,'ComboBoxDisplayValueViewer')]",
    comboboxList: "//ul[contains(@id,'ComboBoxList))",
    optionByText: text => {
        return `//div[contains(@id,'ComboBoxDisplayValueViewer') and text()='${text}']`
    },
    selectedOptionRowByText: text =>
        `//div[@data-component='SortableGridList']/div[descendant::span[text()='${text}']]`,
    removeOccurrenceButton: `//button[@aria-label='Remove occurrence']`,
    removeOccurrenceButtonByText: text =>
        `//span[text()='${text}']/parent::div/following-sibling::button[@aria-label='Remove occurrence']`,
};

class ComboBoxListInput extends BasDropdown {

    constructor(parentElementXpath = '') {
        super();
        this._container = parentElementXpath;
    }

    get container() {
        return this._container;
    }

    get dataComponentDiv() {
        return XPATH.dataComponent;
    }

    async selectFilteredOptionAndClickOnApply(option) {
        try {
            await this.doFilterItem(option);
            // 2. Wait for the required option is displayed then click on it:
            await this.clickOnOptionByDisplayName(option);
            // 3. Click on 'OK' button:
            return await this.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(`ComboBoxListInput, tried to click on the option: ${option} `, 'err_combobox_dropdown', err);
        }
    }

    async selectFilteredOption(option) {
        try {
            await this.doFilterItem(option);
            // 2. Wait for the required option is displayed then click on it:
            await this.clickOnOptionByDisplayName(option);
        } catch (err) {
            await this.handleError(`ComboBoxListInput, tried to click on the option: ${option} `, 'err_combobox_dropdown', err);
        }
    }

    async clickOnRemoveSelectedOptionButton(optionName) {
        try {
            const locator = this._container + XPATH.dataComponent + XPATH.removeOccurrenceButtonByText(optionName);
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`ComboBoxListInput - failed to remove option: ${optionName}`,
                'err_combobox_remove_option', err);
        }
    }
}

module.exports = ComboBoxListInput;
