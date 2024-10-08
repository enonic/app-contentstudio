const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('./../../libs/elements');
const PrincipalComboBox = require('../components/selectors/principal.combobox.dropdon');
const DependantsControls = require('./dependant.controls');

const xpath = {
    container: `//div[contains(@id,'RequestContentPublishDialog')]`,
    createRequestButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Create request')]]`,
    changesInput: `//div[contains(@id,'FormItem') and descendant::label[text()='Describe the changes']]`,
    publishItemList: "//ul[contains(@id,'PublishDialogItemList')]",
    dependantList: "//ul[contains(@id,'PublishDialogDependantList')]",
    warningMessagePart1: "//div[contains(@id,'PublishIssuesStateBar')]/span[@class='part1']",
    warningMessagePart2: "//div[contains(@id,'PublishIssuesStateBar')]/span[@class='part2']",
    invalidIcon: "//span[contains(@class,'icon-state-invalid')]",
    errorEntry: "//div[contains(@id,'DialogStateEntry') and contains(@class,'error-entry')]",
    excludeInvalidItems: "//button[child::span[contains(.,'Exclude')]]",
    inProgressEntryDiv: "//div[contains(@id,'DialogStateEntry') and descendant::span[contains(@class,'icon-state-in-progress')]]",
    invalidEntryDiv: "//div[contains(@id,'DialogStateEntry') and descendant::span[contains(@class,'icon-state-invalid')]]",
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

    constructor() {
        super();
        this.dependantsControls = new DependantsControls(xpath.container);
    }

    get dependantsBlock() {
        return xpath.container + lib.DEPENDANTS.DEPENDANTS_BLOCK;
    }

    get invalidIcon() {
        return xpath.container + xpath.invalidEntryDiv + xpath.invalidIcon;
    }

    get nextButton() {
        return xpath.container + lib.actionButton('Next');
    }

    get cancelButtonTop() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
    }

    get previousButton() {
        return xpath.container + lib.dialogButton('Previous');
    }

    get markAsReadyButton() {
        return xpath.container + xpath.inProgressEntryDiv + lib.actionButton('Mark as ready');
    }

    get excludeItemsInProgressButton() {
        return xpath.container + xpath.inProgressEntryDiv + lib.PUBLISH_DIALOG.EXCLUDE_BTN;
    }

    get excludeInvalidItemsButton() {
        return xpath.container + xpath.invalidEntryDiv + xpath.excludeInvalidItems;
    }

    get createRequestButton() {
        return xpath.container + xpath.createRequestButton;
    }

    get describeChangesInput() {
        return xpath.container + xpath.changesInput + lib.TEXT_INPUT;
    }

    get warningMessagePart1() {
        return xpath.container + xpath.warningMessagePart1;
    }

    async waitForAllDependantsCheckboxDisplayed() {
        return await this.dependantsControls.waitForAllDependantsCheckboxDisplayed();
    }

    async waitForAllDependantsCheckboxNotDisplayed() {
        return await this.dependantsControls.waitForAllDependantsCheckboxNotDisplayed();
    }

    async clickOnAllDependantsCheckbox() {
        await this.dependantsControls.clickOnAllDependantsCheckbox();
        return await this.pause(1000);
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

    // dialog-state-bar:
    async waitForMarkAsReadyButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.markAsReadyButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_mark_as_ready_btn');
            throw new Error(`Request Publishing, Mark as ready button is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    // dialog-state-bar
    async waitForMarkAsReadyButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.markAsReadyButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_mark_as_ready_btn');
            throw new Error(`Request Publishing, Mark as ready button should be not visible, screenshot: ${screenshot} ` + err);
        }
    }

    // dialog-state-bar
    waitForExcludeItemsInProgressButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.excludeItemsInProgressButton, appConst.mediumTimeout);
    }

    // dialog-state-bar
    waitForExcludeItemsInProgressButtonDisplayed() {
        return this.waitForElementDisplayed(this.excludeItemsInProgressButton, appConst.mediumTimeout);
    }

    // dialog-state-bar
    async clickOnExcludeItemsInProgressButton() {
        await this.waitForElementDisplayed(this.excludeItemsInProgressButton, appConst.mediumTimeout);
        await this.clickOnElement(this.excludeItemsInProgressButton);
        return await this.pause(500);
    }

    // dialog-state-bar
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

    async waitForDialogLoaded() {
        await this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout);
        await this.pause(1000);
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

    async clickOnDropDownHandleInAssigneesCombobox() {
        try {
            let principalComboBox = new PrincipalComboBox();
            await principalComboBox.clickOnDropdownHandle(xpath.container);
            return await this.pause(300);
        } catch (err) {
            throw new Error('Request Publish Dialog -Error when clicking on Assignees button:' + err);
        }
    }

    async getOptionsInAssigneesDropdownList() {
        let principalComboBox = new PrincipalComboBox();
        return await principalComboBox.getPrincipalsDisplayNameInOptions(xpath.container);
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

    // Dependants block:
    async waitForHideExcludedItemsButtonNotDisplayed() {
        return await this.dependantsControls.waitForHideExcludedItemsButtonNotDisplayed();
    }

    async waitForHideExcludedItemsButtonDisplayed() {
        try {
            return await this.dependantsControls.waitForHideExcludedItemsButtonDisplayed();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_excluded_items_btn');
            throw new Error(`Hide excluded button should be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForShowExcludedItemsButtonDisplayed() {
        return await this.dependantsControls.waitForShowExcludedItemsButtonDisplayed();
    }

    async waitForShowExcludedItemsButtonNotDisplayed() {
        return await this.dependantsControls.waitForShowExcludedItemsButtonNotDisplayed();
    }

    async clickOnShowExcludedItemsButton() {
        await this.dependantsControls.clickOnShowExcludedItemsButton();
        return await this.pause(1000);
    }

    async clickOnHideExcludedItemsButton() {
        await this.dependantsControls.clickOnHideExcludedItemsButton();
        return await this.pause(1000);
    }

    async clickOnApplySelectionButton() {
        await this.dependantsControls.clickOnApplySelectionButton();
        return await this.pause(500);
    }

    async getDisplayNameInDependentItems() {
        return await this.dependantsControls.getDisplayNameInDependentItems();
    }

    async isDependantCheckboxSelected(displayName) {
        return await this.dependantsControls.isDependantCheckboxSelected(displayName);
    }

    async isAllDependantsCheckboxSelected() {
        return await this.dependantsControls.isAllDependantsCheckboxSelected();
    }

    async waitForApplySelectionButtonDisplayed() {
        return await this.dependantsControls.waitForApplySelectionButtonDisplayed();
    }

    async waitForCancelSelectionButtonDisplayed() {
        return await this.dependantsControls.waitForCancelSelectionButtonDisplayed();
    }

    async clickOnCheckboxInDependentItem(displayName) {
        await this.dependantsControls.clickOnCheckboxInDependentItem(displayName);
        return await this.pause(300);
    }

    async isDependantCheckboxEnabled(displayName) {
        return await this.dependantsControls.isDependantCheckboxEnabled(displayName);
    }
}

module.exports = CreateRequestPublishDialog;

