/**
 * Created on 12.02.2024  updated on 12.02.2026
 */
const BasDropdown = require('./base.dropdown');
const appConst = require('../../../libs/app_const');
const { DROPDOWN } = require('../../../libs/elements');
const XPATH = {
    listBoxUL: "//ul[contains(@id,'PrincipalsListBox')]",
    principalViewerDiv: "//div[contains(@id,'PrincipalViewer')]",
};

class AssigneeSelector extends BasDropdown {
    constructor(parentElementXpath = '') {
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
        return "//div[contains(@data-component,'PrincipalSelector')]";
    }

    async selectFilteredUser(userDisplayName) {
        try {
            await this.typeCharsInFilterItem(userDisplayName);
            await this.clickOnOptionByDisplayName(userDisplayName);
        } catch (err) {
            await this.handleError(
                `Principal Selector, tried to click on the option, ${userDisplayName} `,
                'err_principal_sel',
                err,
            );
        }
    }

    // Returns display names of the options (principal display names) in the dropdown.
    // Returns an empty array when the popup shows the 'No results' message.
    async getPrincipalsDisplayNameInOptions() {
        let optionsLocator = DROPDOWN.COMBOBOX_POPUP + "//div[@role='option']/div/div[1]//span[1]";
        await this.browser.waitUntil(
            async () => {
                let options = await this.getDisplayedElements(optionsLocator);
                if (options.length > 0) {
                    return true;
                }
                return await this.isElementDisplayed(DROPDOWN.COMBOBOX_EMPTY_OPTIONS);
            },
            {
                timeout: appConst.mediumTimeout,
                timeoutMsg: "Assignees dropdown: neither options nor the 'No results' message appeared",
            },
        );
        await this.pause(200);
        return await this.getTextInDisplayedElements(optionsLocator);
    }
}

module.exports = AssigneeSelector;
