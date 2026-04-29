const BaseIssueDetailsDialog = require('./base.details.dialog');
const {DROPDOWN, COMMON, BUTTONS, ISSUE, DIALOG_ITEMS, TREE_GRID} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const DependantsControls = require('./dependant.controls');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');
const DiffStatusBadge = require("../components/diff.status.badge");

const xpath = {
    container: `//div[@data-component='IssueDialogDetailsContent' and @role='dialog']`,
    mainItemDivByName: name => DIALOG_ITEMS.PRIMARY_DATA_COMPONENT + DIALOG_ITEMS.mainItemRowByName(name),
    includeChildrenToggler: `//div[contains(@id,'IncludeChildrenToggler')]`,
};

class IssueDetailsDialogItemsTab extends BaseIssueDetailsDialog {

    constructor() {
        super();
        this.dependantsControls = new DependantsControls(xpath.container);
    }

    get itemsComboboxDropdownHandle() {
        return xpath.container + DROPDOWN.CONTENT_COMBOBOX + DROPDOWN.DROP_DOWN_HANDLE;
    }

    get showExcludedItemsButton() {
        return xpath.container + lib.togglerButton('Show excluded');
    }

    // clicks on Publish... button and  opens 'Publishing Wizard'
    async clickOnPublishAndOpenPublishWizard() {
        try {
            await this.clickOnElement(this.publishNowButton);
            let publishContentDialog = new ContentPublishDialog();
            await publishContentDialog.waitForDialogOpened();
            await publishContentDialog.pause(1000);
            return publishContentDialog;
        } catch (err) {
            await this.saveScreenshot('err_click_on_publish_and_close');
            throw new Error('Error when clicking on Publish and close ' + err);
        }
    }

    isPublishButtonDisplayed() {
        return this.isElementDisplayed(this.publishNowButton);
    }

    isPublishButtonEnabled() {
        return this.isElementEnabled(this.publishNowButton);
    }

    async clickOnDropdownHandle() {
        let contentSelectorDropdown = new ContentSelectorDropdown();
        await contentSelectorDropdown.clickOnDropdownHandle(xpath.container);
        await this.pause(700);
    }

    async clickOnCheckboxInDropdown(index) {
        let contentSelectorDropdown = new ContentSelectorDropdown();
        await contentSelectorDropdown.clickOnCheckboxInDropdown(index, xpath.container);
    }

    async clickOnApplyButtonInCombobox() {
        let contentSelectorDropdown = new ContentSelectorDropdown();
        await contentSelectorDropdown.clickOnApplySelectionButton(xpath.container);
    }

    async waitForPublishButtonEnabled() {
        return await this.waitForElementEnabled(this.publishNowButton);
    }

    async waitForPublishButtonDisabled() {
        try {
            return await this.waitForElementNotClickable(this.publishNowButton);
        } catch (err) {
            await this.handleError(`Items tab - 'Publish now'  should be disabled`, 'err_issue_publish_btn', err);
        }
    }

    async waitForItemsOptionsFilterInputDisplayed() {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            await contentSelectorDropdown.waitForOptionFilterInputDisplayed(xpath.container);
        } catch (err) {
            throw new Error('`Options filter input` should be displayed in Issue Details ' + err);
        }
    }

    async waitForContentOptionsFilterInputDisabled() {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            await contentSelectorDropdown.waitForOptionFilterInputDisabled(xpath.container);
        } catch (err) {
            throw new Error(' `Options filter input` should be disabled in Issue Details ' + err)
        }
    }

    async getMainItemsToPublishDisplayName() {
        const locator = xpath.container + DIALOG_ITEMS.PRIMARY_DATA_COMPONENT + DIALOG_ITEMS.ITEMS_NAME_SPAN;
        return await this.getTextInDisplayedElements(locator);
    }

    async getDependantItemsToPublishName() {
        const locator = xpath.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV + DIALOG_ITEMS.ITEMS_NAME_SPAN;
        return await this.getTextInDisplayedElements(locator);
    }

    // return content status for the Primary item with such name in the dialog
    async getContentStatus(name) {
        const locator = xpath.container + DIALOG_ITEMS.PRIMARY_DATA_COMPONENT + DIALOG_ITEMS.mainItemRowByName(name);
        const diffStatusBadge = new DiffStatusBadge(locator);
        return await diffStatusBadge.getStatusText();
    }


    async excludeMainItem(name) {
        const locator = xpath.container + DIALOG_ITEMS.PRIMARY_DATA_COMPONENT +
            DIALOG_ITEMS.mainItemRowByName(name) + BUTTONS.buttonAriaLabel('Remove from list');
        await this.clickOnElement(locator);
        return await this.pause(300);
    }


    async filterAndSelectItem(displayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown(xpath.container);
            await contentSelectorDropdown.selectFilteredByDisplayNameContent(displayName);
        } catch (err) {
            await this.handleError(`Issue Details dialog, tried to select the item in Items combobox: ${displayName}`,
                'err_select_items_combobox', err);
        }
    }

    async waitForIncludeChildrenIsOn(contentName) {
        let locator = xpath.container + xpath.selectionItemByDisplayName(contentName) + lib.INCLUDE_CHILDREN_TOGGLER;
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        let result = await this.getAttribute(locator, 'class');
        return result.includes('include-children-toggler on');
    }

    // Dependants controls:
    async clickOnAllCheckbox() {
        return await this.dependantsControls.clickOnAllDependantsCheckbox()
    }

    async waitForHideExcludedItemsButtonDisplayed() {
        try {
            return await this.dependantsControls.waitForHideExcludedItemsButtonDisplayed();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_excluded_items_btn');
            throw new Error(`Hide excluded button should be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForAllDependantsCheckboxDisplayed() {
        return await this.dependantsControls.waitForAllDependantsCheckboxDisplayed();
    }

    async isAllDependantsCheckboxSelected() {
        return await this.dependantsControls.isAllDependantsCheckboxSelected();
    }

    async getNumberInAllCheckbox() {
        return await this.dependantsControls.getNumberInAllCheckbox();
    }

    async waitForAllDependantsCheckboxNotDisplayed() {
        return await this.dependantsControls.waitForAllDependantsCheckboxNotDisplayed();
    }

    async waitForShowExcludedItemsButtonDisplayed() {
        return await this.dependantsControls.waitForShowExcludedItemsButtonDisplayed()
    }

    async waitForShowExcludedItemsButtonNotDisplayed() {
        return await this.dependantsControls.waitForShowExcludedItemsButtonNotDisplayed();
    }

    async clickOnShowExcludedItemsButton() {
        await this.dependantsControls.clickOnShowExcludedItemsButton();
    }

    async waitForApplySelectionButtonDisplayed() {
        return await this.dependantsControls.waitForApplySelectionButtonDisplayed();
    }

    async clickOnApplySelectionButton() {
        return await this.dependantsControls.clickOnApplySelectionButton();
    }

    async waitForCancelSelectionButtonDisplayed() {
        return await this.dependantsControls.waitForCancelSelectionButtonDisplayed();
    }

    async clickOnCheckboxInDependentItem(displayName) {
        return await this.dependantsControls.clickOnCheckboxInDependentItem(displayName);
    }

    async clickOnHideExcludedItemsButton() {
        return await this.dependantsControls.clickOnHideExcludedItemsButton();
    }

    async waitForHideExcludedItemsButtonNotDisplayed() {
        return await this.dependantsControls.waitForHideExcludedItemsButtonNotDisplayed();
    }

    async getDisplayNameInDependentItems() {
        return await this.dependantsControls.getDisplayNameInDependentItems();
    }

    async isDependantCheckboxSelected(displayName) {
        return await this.dependantsControls.isDependantCheckboxSelected(displayName);
    }

    async isDependantCheckboxEnabled(displayName) {
        return await this.dependantsControls.isDependantCheckboxEnabled(displayName);
    }

    async waitForDependenciesListDisplayed() {
        const locator = xpath.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV + DIALOG_ITEMS.ITEMS_NAME_SPAN;
        return await this.waitForElementDisplayed(locator);
    }

    async waitForDependenciesListNotDisplayed() {
        const locator = xpath.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV + DIALOG_ITEMS.ITEMS_NAME_SPAN;
        return await this.waitForElementNotDisplayed(locator);
    }
}

module.exports = IssueDetailsDialogItemsTab;
