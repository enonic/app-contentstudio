/**
 * Created on 02.02.2026
 */
const ContentSelectorDropdown = require('./content.selector.dropdown');
const appConst = require('../../../libs/app_const');
const {DROPDOWN} = require('../../../libs/elements');
const AssigneeSelectorDropdown = require('./assignee.selector.dropdown');

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
            let optionLocator = DROPDOWN.treeItemByDisplayName(optionDisplayName);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            await this.clickOnElement(optionLocator);
        } catch (err) {
            await this.handleError(`Issue items selector, tried to click on filtered by display name option: ${optionDisplayName}`,
                'err_issue_items_selector', err);
        }
    }

    async getPrincipalsDisplayNameInOptions() {
        let principalComboBox = new AssigneeSelectorDropdown();
        return await principalComboBox.getPrincipalsDisplayNameInOptions();
    }
}

module.exports = IssueItemsSelector;
