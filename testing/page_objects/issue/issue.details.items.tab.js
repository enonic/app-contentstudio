const BaseIssueDetailsDialog = require('./base.details.dialog');
const {NEW_DROPDOWN, COMMON, BUTTONS} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const DependantsControls = require('./dependant.controls');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');

const xpath = {
    container: `//div[@data-component='IssueDialogDetailsContent' and @role='dialog']`,
    panelItemsDiv: `//div[contains(@id,'panel-items')]`,
    includeChildrenToggler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    itemsToPublish: `//div[contains(@id,'TogglableStatusSelectionItem')]`,
    dependantList: "//ul[contains(@id,'PublishDialogDependantList')]",
    dependantsDiv: "//div[@class='dependants']",
    editEntry: "//div[contains(@id,'DialogStateEntry') and contains(@class,'edit-entry')]",
    selectionItemByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    dependantSelectionItemByDisplayName:
        text => `//ul[contains(@id,'PublishDialogDependantList')]//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    selectionItemStatusByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and text()='${text}']]//div[@class='status']`,
};

class IssueDetailsDialogItemsTab extends BaseIssueDetailsDialog {

    constructor() {
        super();
        this.dependantsControls = new DependantsControls(xpath.container);
    }

    get itemsComboboxDropdownHandle() {
        return xpath.container + NEW_DROPDOWN.CONTENT_COMBOBOX + NEW_DROPDOWN.DROP_DOWN_HANDLE;
    }

    get showExcludedItemsButton() {
        return xpath.container + lib.togglerButton('Show excluded');
    }

    get publishNowButton() {
        return xpath.container + COMMON.FOOTER_ELEMENT + BUTTONS.buttonByLabel('Publish now');
    }

    get itemNamesToPublish() {
        return xpath.container + xpath.itemsToPublish + lib.H6_DISPLAY_NAME;
    }

    async clickOnIncludeChildrenToggler(displayName) {
        try {
            let selector = xpath.selectionItemByDisplayName(displayName) + lib.INCLUDE_CHILDREN_TOGGLER;
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            await this.clickOnElement(selector);
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot('err_click_on_dependent');
            throw new Error('Error when clicking on dependant ' + displayName + ' ' + err);
        }
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
        return await this.waitForElementEnabled(this.publishNowButton, appConst.mediumTimeout);
    }

    async waitForPublishButtonDisabled() {
        try {
            return await this.waitForElementNotClickable(this.publishNowButton, appConst.mediumTimeout);
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

    getItemDisplayNames() {
        return this.getTextInElements(this.itemNamesToPublish).catch(err => {
            throw new Error('Items Tab:error when getting display names of items: ' + err)
        })
    }

    async getContentStatus(displayName) {
        let selector = xpath.selectionItemByDisplayName(displayName) + `//div[contains(@class,'status')][last()]`;
        let result = await this.getDisplayedElements(selector);
        return await this.getBrowser().getElementText(result[0].elementId);
    }

    async clickOnIncludeChildItems(displayName) {
        try {
            let includeIcon = xpath.selectionItemByDisplayName(displayName) + xpath.includeChildrenToggler;
            await this.waitForElementDisplayed(includeIcon, appConst.shortTimeout);
            await this.clickOnElement(includeIcon);
            return await this.pause(2000);
        } catch (err) {
            await this.saveScreenshot('err_issue_items');
            throw new Error('error during clicking on `Include Child items`: ' + err)
        }
    }

    async excludeItem(displayName) {
        let removeIcon = xpath.selectionItemByDisplayName(displayName) + "//div[contains(@class,'icon remove')]";
        try {
            await this.waitForElementDisplayed(removeIcon, appConst.shortTimeout);
            await this.clickOnElement(removeIcon)
            return await this.pause(700);
        } catch (err) {
            throw new Error("error during clicking on 'remove' icon: " + err)
        }
    }


    async filterAndSelectItem(itemDisplayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            return await contentSelectorDropdown.selectFilteredByDisplayNameContent(itemDisplayName, xpath.container);
        } catch (err) {
            throw new Error("Issue Details dialog -  " + err);
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
        let locator = xpath.container + xpath.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER;
        return await this.waitForElementDisplayed(locator);
    }

    async waitForDependenciesListNotDisplayed() {
        let locator = xpath.container + xpath.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER;
        return await this.waitForElementNotDisplayed(locator);
    }
}

module.exports = IssueDetailsDialogItemsTab;
