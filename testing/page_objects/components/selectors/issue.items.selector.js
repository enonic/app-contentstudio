/**
 * Created on 02.02.2026
 */
const ContentSelectorDropdown = require('./content.selector.dropdown');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const {NEW_DROPDOWN} = require('../../../libs/elements');

const XPATH = {
    principalViewerDiv: "//div[contains(@id,'PrincipalViewer')]",
};

class IssueItemsSelector extends ContentSelectorDropdown {

    constructor(parentElementXpath) {
        super();
        this._container = parentElementXpath;
    }

    get container() {
        return this._container;
    }

    get dataComponentDiv() {
        return "//div[contains(@data-component,'IssueItemsSelector')]";
    }


    async clickOnFilteredByDisplayNameContent(displayName) {
        try {
            await this.doFilterItem(displayName);
            await this.clickOnFilteredByDisplayNameTreeItem(displayName);
            await this.pause(500);
        } catch (err) {
            await this.handleError(`Create issue, items selector, tried to click on the filtered option, ${displayName} `, 'err_items_sel',
                err);
        }
    }

    async clickOnFilteredByDisplayNameTreeItem(optionDisplayName) {
        try {
            const popupLocator = "//div[@data-combobox-popup='' or @data-combobox-popup]";
            let optionLocator = NEW_DROPDOWN.treeItemByDisplayName(optionDisplayName);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            await this.clickOnElement(optionLocator);
        } catch (err) {
            await this.handleError(`Dropdown Selector, tried to click on filtered by display name option: ${optionDisplayName}`,
                'err_click_filtered_option', err);
        }
    }

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

module.exports = IssueItemsSelector;
