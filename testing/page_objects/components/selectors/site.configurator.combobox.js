/**
 * Created on 29.01.2024
 */
const BasDropdown = require('./base.dropdown');

XPATH = {
    appSelector: "//div[@data-component='ApplicationSelector']",
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

    async selectFilteredApplicationAndClickOnApply(appDisplayName) {
        try {
            await this.doFilterItem(appDisplayName);
            await this.clickOnOptionByDisplayName(appDisplayName);
            await this.clickOnApplySelectionButton();
            await this.pause(500);
        } catch (err) {
            await this.handleError(`SiteConfigurator ComboBox, tried to select application: ${appDisplayName}`, 'err_select_app', err);
        }
    }
}

module.exports = SiteConfiguratorComboBox;
