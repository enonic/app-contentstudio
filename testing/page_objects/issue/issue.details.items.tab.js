const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const LoaderComboBox = require('../components/loader.combobox');
const DependantsControls = require('./dependant.controls');

const xpath = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    buttonRow: `//div[contains(@id,'IssueDetailsDialogButtonRow')]`,
    itemList: `//ul[contains[@id,'PublishDialogItemList']`,
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

class IssueDetailsDialogItemsTab extends Page {

    constructor() {
        super();
        this.dependantsControls = new DependantsControls(xpath.container);
    }

    get dropdownHandle() {
        return xpath.container + lib.CONTENT_COMBOBOX + lib.DROP_DOWN_HANDLE;
    }

    get applySelectionButton() {
        return xpath.container + xpath.editEntry + lib.actionButton('Apply');
    }

    get showExcludedItemsButton() {
        return xpath.container + lib.togglerButton('Show excluded');
    }

    get contentOptionsFilterInput() {
        return xpath.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get reopenIssueButton() {
        return xpath.container + lib.dialogButton('Reopen Issue');
    }

    get publishButton() {
        return xpath.container + xpath.buttonRow + lib.dialogButton('Publish...');
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
            await this.clickOnElement(this.publishButton);
            let publishContentDialog = new ContentPublishDialog();
            await publishContentDialog.waitForDialogOpened();
            return publishContentDialog;
        } catch (err) {
            this.saveScreenshot('err_click_on_publish_and_close');
            throw new Error('Error when clicking on Publish and close ' + err);
        }
    }

    isPublishButtonDisplayed() {
        return this.isElementDisplayed(this.publishButton);
    }

    isPublishButtonEnabled() {
        return this.isElementEnabled(this.publishButton);
    }

    async clickOnDropdownHandle() {
        await this.waitForElementDisplayed(this.dropdownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.dropdownHandle);
        await this.pause(1000);
    }

    async clickOnCheckboxInDropdown(index) {
        let loaderComboBox = new LoaderComboBox();
        await loaderComboBox.clickOnCheckboxInDropdown(index, lib.CONTENT_COMBOBOX);
    }

    async clickOnApplyButtonInCombobox() {
        let loaderComboBox = new LoaderComboBox();
        await loaderComboBox.clickOnApplyButton();
    }

    async waitForPublishButtonEnabled() {
        return await this.waitForElementEnabled(this.publishButton, appConst.mediumTimeout);
    }

    async waitForPublishButtonDisabled() {
        try {
            return await this.waitForElementNotClickable(this.publishButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_issue_publish_btn');
            throw new Error(`Publish button is not disabled, screenshot: ${screenshot} ` + err);
        }
    }

    waitForContentOptionsFilterInputDisplayed() {
        return this.isElementDisplayed(this.contentOptionsFilterInput).catch(err => {
            throw new Error('Error when checking the `Options filter input` in Issue Details ' + err)
        })
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

    async waitForReopenIssueButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.reopenIssueButton, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("'Reopen Issue' button is not displayed: " + err)
        }
    }

    async addItem(itemDisplayName) {
        try {
            let loaderComboBox = new LoaderComboBox();
            return await loaderComboBox.typeTextAndSelectOption(itemDisplayName, xpath.container);
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
        return await this.dependantsControls.clickOnAllCheckbox();
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
