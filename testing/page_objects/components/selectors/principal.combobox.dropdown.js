/**
 * Created on 12.02.2024  updated on 12.02.2026
 */
const BasDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const XPATH = {
    listBoxUL: "//ul[contains(@id,'PrincipalsListBox')]",
    principalViewerDiv: "//div[contains(@id,'PrincipalViewer')]",
};

class PrincipalSelector extends BasDropdown {

    constructor(parentElementXpath) {
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
            await this.clickOnFilteredByDisplayNameOption(userDisplayName);
        } catch (err) {
            await this.handleError(`Principal Selector, tried to click on the filtered option, ${userDisplayName} `, 'err_principal_sel',
                err);
        }
    }

    // TODO: Refactor this method for epic-enonic-ui
    async getPrincipalsDisplayNameInOptions(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.listBoxUL + XPATH.principalViewerDiv + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = PrincipalSelector;
