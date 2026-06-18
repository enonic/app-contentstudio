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

}

module.exports = SiteConfiguratorComboBox;
