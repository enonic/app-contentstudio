const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('./../../libs/elements');

const xpath = {
    container: `//div[contains(@id,'RequestContentPublishDialog')]`,
    createRequestButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Create request')]]`,
    changesInput: `//div[contains(@id,'FormItem') and descendant::label[text()='Describe the changes']]`,
    publishItemList: "//ul[contains(@id,'PublishDialogItemList')]",
    dependantList: "//ul[contains(@id,'PublishDialogDependantList')]",
    warningMessagePart1: "//div[contains(@id,'PublishIssuesStateBar')]/span[@class='part1']",
    warningMessagePart2: "//div[contains(@id,'PublishIssuesStateBar')]/span[@class='part2']",
    assigneesComboBox: "//div[contains(@id,'LoaderComboBox') and @name='principalSelector']",
    invalidIcon: "//span[contains(@class,'icon-state-invalid')]",
    errorEntry: "//div[contains(@id,'DialogStateEntry') and contains(@class,'error-entry')]",
    excludeInvalidItems: "//button[child::span[contains(.,'Exclude invalid items')]]",
    contentSummaryByDisplayName:
        displayName => `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    itemToRequest:
        displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    contentStatus:
        displayName => `//div[contains(@id,'StatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/div[contains(@class,'status')][2]`,

};
// Modal Dialog for creating of new publish request
// Select a content then expand Publish menu and click on 'Request Publishing...' menu item
class CreateRequestPublishDialog extends Page {

    get applySelectionButton() {
        return xpath.container + lib.DEPENDANTS.EDIT_ENTRY + lib.actionButton('Apply');
    }

    get cancelSelectionButton() {
        return xpath.container + lib.DEPENDANTS.EDIT_ENTRY + lib.actionButton('Cancel');
    }

    get showExcludedItemsButton() {
        return xpath.container + lib.togglerButton('Show excluded items');
    }

    get hideExcludedItemsButton() {
        return xpath.container + lib.togglerButton('Hide excluded items');
    }

    get dependantsBlock() {
        return xpath.container + lib.DEPENDANTS.DEPENDANTS_BLOCK;
    }

    get invalidIcon() {
        return xpath.container + xpath.errorEntry + xpath.invalidIcon;
    }

    get nextButton() {
        return xpath.container + lib.actionButton('Next');
    }

    get assigneesDropDownHandle() {
        return xpath.container + "//div[contains(@id,'PrincipalComboBox')]" + lib.DROP_DOWN_HANDLE;
    }

    get cancelButtonTop() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
    }

    get previousButton() {
        return xpath.container + lib.dialogButton('Previous');
    }

    get markAsReadyButton() {
        return xpath.container + xpath.errorEntry + lib.actionButton('Mark as ready');
    }

    get excludeItemsInProgressButton() {
        return xpath.container + xpath.errorEntry + lib.PUBLISH_DIALOG.EXCLUDE_ITEMS_IN_PROGRESS_BTN;
    }

    get excludeInvalidItemsButton() {
        return xpath.container + xpath.errorEntry + xpath.excludeInvalidItems;
    }

    get createRequestButton() {
        return xpath.container + xpath.createRequestButton;
    }

    get describeChangesInput() {
        return xpath.container + xpath.changesInput + lib.TEXT_INPUT;
    }

    get showDependentItemsLink() {
        return xpath.container + xpath.showDependentItemsLink;
    }

    get warningMessagePart1() {
        return xpath.container + xpath.warningMessagePart1;
    }

    get allDependantsCheckbox() {
        return xpath.container + lib.checkBoxDiv('All');
    }

    waitForAllDependantsCheckboxDisplayed() {
        return this.waitForElementDisplayed(this.allDependantsCheckbox, appConst.mediumTimeout);
    }

    waitForAllDependantsCheckboxNotDisplayed() {
        return this.waitForElementNotDisplayed(this.allDependantsCheckbox, appConst.mediumTimeout);
    }

    async clickOnAllDependantsCheckbox() {
        await this.waitForAllDependantsCheckboxDisplayed();
        await this.clickOnElement(this.allDependantsCheckbox + "//label[contains(.,'All')]");
    }

    async isAllDependantsCheckboxSelected() {
        // 1. div-checkbox should be displayed:
        await this.waitForAllDependantsCheckboxDisplayed();
        // 2. Check the input:
        return await this.isSelected(this.allDependantsCheckbox + lib.CHECKBOX_INPUT);
    }

    async getDisplayNameInDependentItems() {
        let locator = xpath.container + lib.DEPENDANTS.DEPENDENT_ITEM_LIST_UL_2 + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER +
                      lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(locator);
    }

    async waitForDependantsBlockDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.dependantsBlock, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dependencies_block');
            throw new Error(`Dependencies block is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnCancelButtonTop() {
        await this.clickOnElement(this.cancelButtonTop);
        return await this.waitForDialogClosed();
    }

    async waitForApplySelectionButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.applySelectionButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_btn');
            throw new Error(`Request publishing - 'Apply selection' button is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForCancelSelectionButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.cancelSelectionButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_cancel_btn');
            throw new Error(`Cancel selection button is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForMarkAsReadyButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.markAsReadyButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_mark_as_ready_btn');
            throw new Error(`Request Publishing, Mark as ready button is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForMarkAsReadyButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.markAsReadyButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_mark_as_ready_btn');
            throw new Error(`Request Publishing, Mark as ready button should be not visible, screenshot: ${screenshot} ` + err);
        }
    }

    waitForExcludeItemsInProgressButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.excludeItemsInProgressButton, appConst.mediumTimeout);
    }

    waitForExcludeItemsInProgressButtonDisplayed() {
        return this.waitForElementDisplayed(this.excludeItemsInProgressButton, appConst.mediumTimeout);
    }

    async clickOnExcludeItemsInProgressButton() {
        await this.waitForElementDisplayed(this.excludeItemsInProgressButton, appConst.mediumTimeout);
        await this.clickOnElement(this.excludeItemsInProgressButton);
        return await this.pause(500);
    }

    async clickOnExcludeInvalidItemsButton() {
        await this.waitForElementDisplayed(this.excludeInvalidItemsButton, appConst.mediumTimeout);
        await this.clickOnElement(this.excludeInvalidItemsButton);
        return await this.pause(500);
    }

    async isItemRemovable(displayName) {
        let selector = xpath.itemToRequest(displayName);
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        let attr = await this.getAttribute(selector, 'class');
        return attr.includes('removable');
    }

    async clickOnItemToPublishAndSwitchToWizard(displayName) {
        let selector = xpath.publishItemList + xpath.itemToRequest(displayName);
        await this.clickOnElement(selector);
        await this.pause(900);
        return await this.getBrowser().switchWindow(displayName);
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout);
    }

    waitForNextButtonDisplayed() {
        return this.waitForElementDisplayed(this.nextButton, appConst.mediumTimeout);
    }

    async waitForNextButtonEnabled() {
        try {
            return await this.waitForElementClickable(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("Request Publishing dialog:  'Next' button should be enabled :" + err);
        }
    }

    async waitForNextButtonDisabled() {
        try {
            return await this.waitForElementNotClickable(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("Request Publishing dialog:  'Next' button should be disabled :" + err);
        }
    }

    async waitForInvalidIconDisplayed() {
        try {
            await this.waitForElementDisplayed(this.invalidIcon, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot('err_request_publish_dialog_invalid_icon');
            throw new Error("Request Publishing dialog:  'invalid' icon should be visible :" + err);
        }
    }

    async waitForInvalidIconNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.invalidIcon, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot('err_request_publish_dialog_invalid_icon');
            throw new Error("Request Publishing dialog:  'invalid' icon should be not visible :" + err);
        }
    }

    waitForPreviousButtonDisplayed() {
        return this.waitUntilDisplayed(this.previousButton, appConst.mediumTimeout);
    }

    waitForCreateRequestButtonDisplayed() {
        return this.waitUntilDisplayed(this.createRequestButton, appConst.mediumTimeout);
    }

    async waitForDialogClosed() {
        let message = 'Request publish Dialog is not closed! timeout is ' + appConst.mediumTimeout;
        await this.getBrowser().waitUntil(async () => {
            return await this.isElementNotDisplayed(xpath.container);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: message});
        return await this.pause(400);
    }

    waitForCreateRequestButtonDisabled() {
        return this.waitForElementDisabled(this.createRequestButton, appConst.mediumTimeout).catch(err => {
            throw new Error('Request Publishing dialog - Create Request button should be disabled ' + err);
        })
    }

    waitForCreateRequestButtonEnabled() {
        return this.waitForElementEnabled(this.createRequestButton, appConst.mediumTimeout).catch(err => {
            throw new Error('Request Publishing dialog - Create Request button should be enabled !' + err);
        })
    }

    getContentStatus(name) {
        let selector = xpath.contentStatus(name);
        return this.getText(selector);
    }

    async clickOnNextButton() {
        try {
            await this.waitForNextButtonDisplayed();
            await this.clickOnElement(this.nextButton);
            return await this.pause(300);
        } catch (err) {
            throw new Error('Request Publish Dialog -Error when clicking on Next button:' + err);
        }
    }

    async clickOnAssigneesDropDownHandle() {
        try {
            let result = await this.getDisplayedElements(this.assigneesDropDownHandle);
            await result[0].click();
            return await this.pause(300);
        } catch (err) {
            throw new Error('Request Publish Dialog -Error when clicking on Assignees button:' + err);
        }
    }

    async getAssigneesOptions() {
        let selector = xpath.container + xpath.assigneesComboBox + lib.SLICK_ROW + lib.H6_DISPLAY_NAME;
        return await this.getTextInDisplayedElements(selector);

    }

    async clickOnPreviousButton() {
        try {
            await this.waitForPreviousButtonDisplayed();
            return await this.clickOnElement(this.previousButton);
        } catch (err) {
            throw new Error('Request Publish Dialog -Error when clicking on Previous button:' + err);
        }
    }

    async clickOnIncludeChildItems(displayName) {
        try {
            let includeIcon = xpath.itemToRequest(displayName) + lib.INCLUDE_CHILDREN_TOGGLER;
            await this.waitForElementDisplayed(includeIcon, appConst.mediumTimeout);
            await this.clickOnElement(includeIcon);
            return await this.pause(1000);
        } catch (err) {
            throw new Error('Request Publishing dialog- error when clicking on `Include Child items`: ' + err)

        }
    }

    async getWorkflowState(displayName) {
        let selector = xpath.contentSummaryByDisplayName(displayName);
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        let result = await this.getAttribute(selector, 'class');
        if (result.includes('in-progress')) {
            return appConst.WORKFLOW_STATE.WORK_IN_PROGRESS;
        } else if (result.includes('ready')) {
            return appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING;
        } else if (result === 'viewer content-summary-and-compare-status-viewer') {
            return appConst.WORKFLOW_STATE.PUBLISHED;

        } else {
            throw new Error("Error during getting the content's state, class is:" + result);
        }
    }

    isWarningMessageDisplayed() {
        return this.isElementDisplayed(this.warningMessagePart1);
    }

    async typeInChangesInput(changes) {
        await this.waitForElementDisplayed(this.describeChangesInput);
        return await this.typeTextInInput(this.describeChangesInput, changes);
    }

    async clickOnCreateRequestButton() {
        await this.waitForCreateRequestButtonEnabled();
        await this.clickOnElement(this.createRequestButton);
        return this.pause(700);
    }

    async clickOnMarkAsReadyButton() {
        try {
            await this.waitForMarkAsReadyButtonDisplayed()
            await this.clickOnElement(this.markAsReadyButton);
            return await this.pause(700);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_mark_as_ready_btn');
            throw new Error(`Error during clicking on Mark as ready button, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForShowExcludedItemsButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_show_excluded_btn');
            await this.saveScreenshot(screenshot);
            throw new Error(`Request Publish dialog , 'Show excluded items' button should be visible! screenshot: ${screenshot} ` + +err)
        }
    }

    async clickOnShowExcludedItemsButton() {
        try {
            await this.waitForShowExcludedItemsButtonDisplayed();
            return await this.clickOnElement(this.showExcludedItemsButton);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_show_excluded_btn');
            await this.saveScreenshot(screenshot);
            throw new Error(
                'Request Publish dialog , Error when clicking on Show Excluded dependent items, screenshot  ' + screenshot + ' ' + err);
        }
    }

    async clickOnHideExcludedItemsButton() {
        try {
            await this.waitForHideExcludedItemsButtonDisplayed();
            await this.clickOnElement(this.hideExcludedItemsButton);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_hide_excluded_btn');
            await this.saveScreenshot(screenshot);
            throw new Error(
                'Request Publish dialog , Error when clicking on Hide Excluded dependent items, screenshot  ' + screenshot + ' ' + err);
        }
    }

    async clickOnApplySelectionButton() {
        await this.waitForApplySelectionButtonDisplayed();
        await this.clickOnElement(this.applySelectionButton);
        return await this.pause(500);
    }

    async getDisplayNameInDependentItems() {
        let locator = xpath.container + xpath.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER + lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(locator);
    }
}

module.exports = CreateRequestPublishDialog;

