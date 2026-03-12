/**
 * Created on 12.02.2024  updated on 12.02.2026
 */
const BasDropdown = require('./base.dropdown');
const appConst = require('../../../libs/app_const');
const {DROPDOWN} = require('../../../libs/elements');
const XPATH = {
    listBoxUL: "//ul[contains(@id,'PrincipalsListBox')]",
    principalViewerDiv: "//div[contains(@id,'PrincipalViewer')]",
};

class PrincipalSelector extends BasDropdown {

    constructor(parentElementXpath='') {
        super();
        this._container = parentElementXpath;
    }

    optionsFilterInput(ariaLabel = 'Assignees') {
        return super.optionsFilterInput(ariaLabel);
    }

    get container() {
        return this._container;
    }

    get dataComponentDiv() {
        return "//div[contains(@data-component,'AssigneeSelector')]";
    }

    async selectFilteredUser(userDisplayName) {
        try {
            await this.doFilterItem(userDisplayName);
            await this.clickOnOptionByDisplayName(userDisplayName);
        } catch (err) {
            await this.handleError(`Principal Selector, tried to click on the option, ${userDisplayName} `, 'err_principal_sel', err);
        }
    }

    // Return display names of the options(principal display name) in the dropdown.
    async getPrincipalsDisplayNameInOptions() {
        let optionsLocator = DROPDOWN.COMBOBOX_POPUP + "//div[@role='option']/div/div[1]//span[1]";
        await this.waitForElementDisplayed(optionsLocator, appConst.mediumTimeout);
        await this.pause(200);
        return await this.getTextInDisplayedElements(optionsLocator);
    }
}

module.exports = PrincipalSelector;
