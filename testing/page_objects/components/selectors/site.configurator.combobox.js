/**
 * Created on 29.01.2024 updated on 24.04.2026
 */
const BasDropdown = require('./base.dropdown');
const {DROPDOWN} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

XPATH = {
    appSelector: "//div[@data-component='SiteConfiguratorInput']",
}

class SiteConfiguratorComboBox extends BasDropdown {

    constructor(parentElementXpath) {
        super();
        this._container = parentElementXpath;
    }

    get container() {
        return this._container
    }

    get dataComponentDiv() {
        return XPATH.appSelector;
    }

    async clickOnCheckboxInDropdown(index) {
        let locator = DROPDOWN.COMBOBOX_POPUP + DROPDOWN.LISTBOX_ITEM_CHECKBOX_LABEL;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let items = await this.findElements(locator);
        await items[index].click();
        return await this.pause(300);
    }

    async clickOnListboxOptionByDisplayName(displayName) {
        let locator = DROPDOWN.COMBOBOX_POPUP + DROPDOWN.listboxItemByDisplayName(displayName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }

    async selectFilteredApplicationAndClickOnApply(appDisplayName) {
        try {
            await this.doFilterItem(appDisplayName);
            await this.clickOnListboxOptionByDisplayName(appDisplayName);
            await this.clickOnApplySelectionButton();
            await this.pause(300);
        } catch (err) {
            await this.handleError(`SiteConfigurator ComboBox, tried to select application: ${appDisplayName}`, 'err_select_app', err);
        }
    }

    async getSelectedOptionsDisplayName() {
        const base = this.dataComponentDiv ? this.container + this.dataComponentDiv : this.container;
        const locator = base + DROPDOWN.ITEM_LABEL_NAME_SPAN;
        return await this.getTextInDisplayedElements(locator);
    }

    async clickOnCheckboxInDropdownByDisplayName(displayName) {
        let locator = DROPDOWN.COMBOBOX_POPUP + DROPDOWN.listboxItemCheckboxByDisplayName(displayName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(300);
    }

}

module.exports = SiteConfiguratorComboBox;
