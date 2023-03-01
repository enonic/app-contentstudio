const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require("../../page_objects/content.publish.dialog");
const LoaderComboBox = require('../components/loader.combobox');

const xpath = {
    container: `//div[contains(@id,'IssueDetailsDialog')]`,
    buttonRow: `//div[contains(@id,'IssueDetailsDialogButtonRow')]`,
    itemList: `//ul[contains[@id,'PublishDialogItemList']`,
    includeChildrenToggler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    itemsToPublish: `//div[contains(@id,'TogglableStatusSelectionItem')]`,
    dependantList: "//ul[contains(@id,'PublishDialogDependantList')]",
    dependantsDiv: "//div[@class='dependants']",
    editEntry: "//div[contains(@id,'DialogStateEntry') and contains(@class,'edit-entry')]",
    dependentItemToPublish: displayName => `//div[contains(@id,'StatusCheckableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    selectionItemByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    dependantSelectionItemByDisplayName:
        text => `//ul[contains(@id,'PublishDialogDependantList')]//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${text}')]]`,

    selectionItemStatusByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and text()='${text}']]//div[@class='status']`,
};

class IssueDetailsDialogItemsTab extends Page {

    get applySelectionButton() {
        return xpath.container + xpath.editEntry + lib.actionButton('Apply');
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

    get allDependantsCheckbox() {
        return xpath.container + xpath.dependantsDiv + lib.checkBoxDiv('All');
    }

    waitForAllDependantsCheckboxDisplayed() {
        return this.waitForElementDisplayed(this.allDependantsCheckbox, appConst.mediumTimeout);
    }

    waitForAllDependantsCheckboxNotDisplayed() {
        return this.waitForElementNotDisplayed(this.allDependantsCheckbox, appConst.mediumTimeout);
    }

    async clickOnAllCheckbox() {
        await this.waitForAllDependantsCheckboxDisplayed();
        await this.clickOnElement(this.allDependantsCheckbox + "//label[contains(.,'All')]");
    }

    async waitForApplySelectionButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.applySelectionButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_issue_apply_btn');
            throw new Error(`Apply selection button is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async getNumberInAllCheckbox() {
        let locator = this.allDependantsCheckbox + '//label';
        return await this.getText(locator);
    }

    async isAllDependantsCheckboxSelected() {
        // 1. div-checkbox should be displayed:
        await this.waitForAllDependantsCheckboxDisplayed();
        // 2. Check the input:
        return await this.isSelected(this.allDependantsCheckbox + lib.CHECKBOX_INPUT);
    }

    async clickOnIncludeChildrenToggler(displayName) {
        try {
            let selector = xpath.selectionItemByDisplayName(displayName) + lib.INCLUDE_CHILDREN_TOGGLER;
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            await this.clickOnElement(selector);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot('err_click_on_dependent');
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

    async clickOnCheckboxInDependentItem(displayName) {
        let selector = xpath.dependentItemToPublish(displayName) + "//div[contains(@id,'Checkbox')]";
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        await this.clickOnElement(selector);
        return await this.pause(400);
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

    getNumberInShowDependentItemsLink() {
        return this.getText(this.showDependentItemsLink).then(result => {
            let startIndex = result.indexOf('(');
            let endIndex = result.indexOf(')');
            return result.substring(startIndex + 1, endIndex);
        }).catch(err => {
            throw new Error('Items Tab:error when getting number in the link : ' + err)
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

    async clickOnApplySelectionButton() {
        await this.waitForApplySelectionButtonDisplayed();
        await this.clickOnElement(this.applySelectionButton);
    }

    excludeItem(displayName) {
        let removeIcon = xpath.selectionItemByDisplayName(displayName) + "//div[contains(@class,'icon remove')]";
        return this.waitForElementDisplayed(removeIcon, appConst.shortTimeout).then(() => {
            return this.clickOnElement(removeIcon)
        }).then(() => {
            return this.pause(1000);
        }).catch(err => {
            throw new Error('error when clicking on `remove icon`: ' + err)
        })
    }

    async waitForReopenIssueButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.reopenIssueButton, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("Reopen Issue button is not displayed: " + err)
        }
    }

    async addItem(itemDisplayName) {
        try {
            let loaderComboBox = new LoaderComboBox();
            return await loaderComboBox.typeTextAndSelectOption(itemDisplayName, xpath.container);
        } catch (err) {
            throw new Error("Task Details dialog -  " + err);
        }
    }

    async getDisplayNameInDependentItems() {
        let locator = xpath.container + xpath.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(locator);
    }

    async waitForIncludeChildrenIsOn(contentName) {
        let locator = xpath.container + xpath.selectionItemByDisplayName(contentName) + lib.INCLUDE_CHILDREN_TOGGLER;
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        let result = await this.getAttribute(locator, 'class');
        return result.includes('include-children-toggler on');
    }
}

module.exports = IssueDetailsDialogItemsTab;
