const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const DateTimeRange = require('../page_objects/components/datetime.range');
const DependantsControls = require('./issue/dependant.controls');

const XPATH = {
    container: "//div[contains(@id,'ContentPublishDialog')]",
    dialogStateBarDiv: "//div[contains(@id,'DialogStateBar')]",
    logMessageLink: "//div[contains(@id,'ContentPublishDialogSubTitle')]/a",
    publishScheduleForm: "//div[contains(@id,'PublishScheduleForm')]",
    scheduleButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Schedule')]]`,
    includeChildrenToogler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    checkableDependentItemDiv: `//div[contains(@id,'StatusCheckableItem')`,
    addScheduleIcon: `//button[contains(@id,'ButtonEl') and contains(@class,'icon-calendar')]`,
    removeItemIcon: `//div[contains(@class,'icon remove')]`,
    publishItemList: "//ul[contains(@id,'PublishDialogItemList')]",
    changeLogInput: "//input[contains(@id,'AutosizeTextInput')]",
    dependantList: "//ul[contains(@id,'PublishDialogDependantList')]",
    readyForPublishingText: "//span[contains(@class,'entry-text') and text()='Content is ready for publishing']",
    mainItemDivByName: name => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]`,
    inProgressStateEntryDiv: "//div[contains(@id,'DialogStateEntry') and descendant::span[contains(@class,'icon-state-in-progress')]]",
    invalidStateEntryDiv: "//div[contains(@id,'DialogStateEntry') and descendant::span[contains(@class,'icon-state-invalid')]]",
    inProgressSpan: "//span[contains(@class,'entry-text') and text()='In progress']",
    contentSummaryByDisplayName: displayName => `//div[contains(@id,'ContentSummaryAndCompareStatusViewer') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    dependentItemContentStatus: displayName => `//div[contains(@id,'StatusCheckableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    contentStatus: displayName => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/div[contains(@class,'status')][2]`,
    removeItemIconByName: name => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]//div[@class='icon remove']`,
    excludedItemsNote: "//span[@class='excluded-items-note']",
};

class ContentPublishDialog extends Page {

    constructor() {
        super();
        this.dependantsControls = new DependantsControls(XPATH.container);
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get dependantsBlock() {
        return XPATH.container + lib.DEPENDANTS.DEPENDANTS_BLOCK
    }

    get changeLogInput() {
        return XPATH.container + XPATH.changeLogInput;
    }

    get logMessageLink() {
        return XPATH.container + XPATH.logMessageLink;
    }

    get publishNowButton() {
        return XPATH.container + lib.actionButton('Publish Now');
    }

    get addScheduleIcon() {
        return XPATH.container + XPATH.addScheduleIcon;
    }

    get scheduleButton() {
        return XPATH.container + XPATH.scheduleButton;
    }

    get includeChildrenToogler() {
        return XPATH.container + XPATH.includeChildrenToogler;
    }

    get markAsReadyButton() {
        return XPATH.container + XPATH.inProgressStateEntryDiv + lib.actionButton('Mark as ready');
    }

    get excludeInvalidItemsButton() {
        return XPATH.container + XPATH.invalidStateEntryDiv + lib.PUBLISH_DIALOG.EXCLUDE_BTN;
    }

    get excludeItemsInProgressButton() {
        return XPATH.container + XPATH.inProgressStateEntryDiv + lib.PUBLISH_DIALOG.EXCLUDE_BTN;
    }

    async waitForDependantsBlockDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.dependantsBlock, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dependencies_block');
            throw new Error(`Apply selection button is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForDependantsBlockNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.dependantsBlock, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dependencies_block');
            throw new Error(`Apply selection button is  displayed, screenshot: ${screenshot} ` + err);
        }
    }

    waitForExcludeInvalidItemsButtonDisplayed() {
        return this.waitForElementDisplayed(this.excludeInvalidItemsButton, appConst.mediumTimeout);
    }

    waitForExcludeInvalidItemsButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.excludeInvalidItemsButton, appConst.mediumTimeout);
    }

    waitForExcludeItemsInProgressButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.excludeItemsInProgressButton, appConst.mediumTimeout);
    }

    waitForExcludeItemsInProgressButtonDisplayed() {
        return this.waitForElementDisplayed(this.excludeItemsInProgressButton, appConst.mediumTimeout);
    }

    async clickOnExcludeInvalidItemsButton() {
        await this.waitForElementDisplayed(this.excludeInvalidItemsButton, appConst.mediumTimeout);
        await this.clickOnElement(this.excludeInvalidItemsButton);
        return await this.pause(500);
    }

    async clickOnExcludeItemsInProgressButton() {
        await this.waitForElementDisplayed(this.excludeItemsInProgressButton, appConst.mediumTimeout);
        await this.clickOnElement(this.excludeItemsInProgressButton);
        return await this.pause(500);
    }

    async waitForMarkAsReadyButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.markAsReadyButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_mark_as_ready_btn');
            throw new Error(`Mark as ready button is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnMarkAsReadyButton() {
        try {
            await this.waitForMarkAsReadyButtonDisplayed();
            await this.clickOnElement(this.markAsReadyButton);
            return await this.pause(700);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_mark_as_ready_btn');
            throw new Error(`Error during clicking on Mar as ready button, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForMarkAsReadyButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.markAsReadyButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_mark_as_ready_btn');
            throw new Error(`Mark as ready button is still displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async markAsReadyButtonDisplayed() {
        await this.waitForElementDisplayed(this.markAsReadyButton, appConst.mediumTimeout);
        return await this.waitForElementEnabled(this.markAsReadyButton, appConst.mediumTimeout);
    }

    async waitForDialogOpened() {
        await this.waitForElementDisplayed(this.publishNowButton, appConst.mediumTimeout);
        await this.pause(300);
    }

    async waitForDialogClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container, appConst.longTimeout);
            await this.pause(500);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_close_publish_dialog');
            await this.saveScreenshot(screenshot);
            throw new Error('Publish dialog must be closed, screenshot: ' + screenshot + "  " + err);
        }
    }

    async clickOnPublishNowButton() {
        try {
            await this.waitForElementEnabled(this.publishNowButton, appConst.longTimeout);
            await this.clickOnElement(this.publishNowButton);
            return await this.pause(1000);
        } catch (err) {
            await this.saveScreenshot('err_click_on_publish_button_publish_dialog');
            throw new Error(`Error when clicking on 'Publish Now' button ` + err);
        }
    }

    isIncludeChildTogglerDisplayed() {
        return this.isElementDisplayed(this.includeChildrenToogler);
    }

    // Click on icon-calendar:
    async clickOnAddScheduleIcon() {
        try {
            await this.waitForElementDisplayed(this.addScheduleIcon, appConst.shortTimeout);
            await this.clickOnElement(this.addScheduleIcon);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot('err_publish_dialog_add_schedule_button');
            throw new Error(`Error when clicking on 'Add Schedule' icon-button  ` + err);
        }
    }

    // Verifies that schedule button is enabled then clicks on it:
    async clickOnScheduleButton() {
        try {
            await this.waitForScheduleButtonEnabled();
            await this.clickOnElement(this.scheduleButton);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_dialog_schedule_button'));
            throw new Error('Error when clicking on Schedule button  ' + err);
        }
    }

    waitForScheduleButtonEnabled() {
        return this.waitForElementEnabled(this.scheduleButton, appConst.mediumTimeout);
    }

    waitForScheduleButtonDisabled() {
        return this.waitForElementDisabled(this.scheduleButton, appConst.mediumTimeout);
    }

    async clickOnIncludeChildrenToogler() {
        try {
            await this.waitForElementDisplayed(this.includeChildrenToogler, appConst.mediumTimeout);
            await this.clickOnElement(this.includeChildrenToogler);
            return await this.pause(700);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_include_children');
            throw new Error('Error when clicking on Include Children toggler, screenshot :' + screenshot + ' ' + err);
        }
    }

    async waitForScheduleButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.scheduleButton, appConst.shortTimeout)
        } catch (err) {
            throw new Error("'Schedule' button should be visible!" + err);
        }
    }

    async getContentStatus(name) {
        let locator = XPATH.contentStatus(name);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getWorkflowState(displayName) {
        let xpath = XPATH.contentSummaryByDisplayName(displayName);
        await this.waitForElementDisplayed(xpath, appConst.mediumTimeout);
        let result = await this.getAttribute(xpath, 'class');
        if (result.includes('in-progress')) {
            return appConst.WORKFLOW_STATE.WORK_IN_PROGRESS;
        } else if (result.includes('ready')) {
            return appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING;
        } else if (result === 'viewer content-summary-and-compare-status-viewer') {
            return appConst.WORKFLOW_STATE.PUBLISHED;

        } else {
            throw new Error("Error when getting content's state, actual result is:" + result);
        }
    }

    async typeTextInChangeLog(text) {
        await this.keys(text);
        return await this.pause(1000);
    }

    async getTextInChangeLog() {
        await this.waitForExist(this.changeLogInput, appConst.shortTimeout);
        return await this.getTextInInput(this.changeLogInput);
    }

    waitForAddScheduleIconDisplayed() {
        return this.waitForElementDisplayed(this.addScheduleIcon, appConst.shortTimeout).catch(err => {
            throw new Error("'Add Schedule' button is not displayed " + err);
        })
    }

    waitForAddScheduleIconNotDisplayed() {
        return this.waitForElementNotDisplayed(this.addScheduleIcon, appConst.shortTimeout).catch(err => {
            throw new Error("'Add Schedule' button should not be displayed " + err);
        })
    }

    isLogMessageLinkDisplayed() {
        return this.isElementDisplayed(this.logMessageLink, appConst.shortTimeout);
    }

    async waitForPublishNowButtonEnabled() {
        try {
            await this.waitForElementDisplayed(this.publishNowButton, appConst.mediumTimeout);
            return await this.waitForElementEnabled(this.publishNowButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('publish_now_disabled');
            await this.saveScreenshot(screenshot);
            throw new Error("Publish Wizard - 'Publish Now' button should be enabled, screenshot: " + screenshot + ' ' + err);
        }
    }

    waitForPublishNowButtonDisabled() {
        return this.waitForElementNotClickable(this.publishNowButton, appConst.mediumTimeout);
    }

    async isRemoveItemIconEnabled(name) {
        let locator = XPATH.mainItemDivByName(name);
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        let attr = await this.getAttribute(locator, 'class');
        return attr.includes('removable');
    }

    async clickOnCancelTopButton() {
        await this.pause(400);
        await this.clickOnElement(this.cancelButtonTop);
    }

    async typeInOnlineFrom(dateTime) {
        let dateTimeRange = new DateTimeRange();
        await dateTimeRange.typeOnlineFrom(dateTime, XPATH.container);
        return await this.pause(300);
    }

    async typeInOnlineTo(dateTime) {
        let dateTimeRange = new DateTimeRange();
        await dateTimeRange.typeOnlineTo(dateTime, XPATH.container);
        return await this.pause(300);
    }

    async clickOnOkButton() {
        let locator = "//div[@class='picker-buttons']//button[child::span[text()='OK']]";
        //let locator = "//div[@class='picker-buttons']//button/span[text()='OK']";
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        let elems = await this.getDisplayedElements(locator);
        await elems[0].click();
        await this.pause(200);
    }

    async getNumberItemsToPublish() {
        let selector = XPATH.container + `//button[contains(@id,'ActionButton')]/span[contains(.,'Publish Now')]`;
        let number = await this.getText(selector);
        let startIndex = number.indexOf('(');
        if (startIndex == -1) {
            throw new Error("Content Publish Dialog - error when get a number in  'Publish now' button  ");
        }
        let endIndex = number.indexOf(')');
        if (endIndex == -1) {
            throw new Error("Content Publish Dialog - error when get a number in  'Publish now' button ");
        }
        return number.substring(startIndex + 1, endIndex);
    }

    async getItemsToPublish() {
        let selector = XPATH.container + XPATH.publishItemList + lib.H6_DISPLAY_NAME;
        let result = await this.getTextInElements(selector);
        return [].concat(result);
    }

    async clickOnMainItemAndSwitchToWizard(displayName) {
        let selector = XPATH.publishItemList + XPATH.mainItemDivByName(displayName);
        await this.clickOnElement(selector);
        await this.pause(1000);
        return await this.getBrowser().switchWindow(displayName);
    }

    async getDisplayNameInDependentItems() {
        let locator = XPATH.container + XPATH.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER + lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(locator);
    }

    async waitForDependenciesListDisplayed() {
        let locator = XPATH.container + XPATH.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER;
        return await this.waitForElementDisplayed(locator);
    }

    async clickOnCloseScheduleFormButton() {
        try {
            let locator = XPATH.container + XPATH.publishScheduleForm + "//a[contains(@class,'icon-close')]";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot('err_close_schedule_form');
            throw new Error("Publish Schedule Form, close icon: " + err);
        }
    }

    waitForScheduleFormNotDisplayed() {
        let locator = XPATH.container + XPATH.publishScheduleForm + "//a[contains(@class,'icon-close')]";
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }

    // get number of items in the span: In progress (4)
    async getNumberOfInProgressItems() {
        let locator = XPATH.container + XPATH.inProgressSpan;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let value = await this.getAttribute(locator, 'data-count');
        return value;
    }

    async getResolvedEntryText() {
        let locator = XPATH.container +
                      "//div[contains(@id,'DialogStateEntry') and contains(@class, 'resolved-entry')]//span[@class='entry-text']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async waitForReadyForPublishingTextDisplayed() {
        let locator = XPATH.container + XPATH.readyForPublishingText;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async waitForExcludedNote() {
        let locator = XPATH.container + XPATH.excludedItemsNote;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return this.getText(locator);
    }

    async getNumberInAllCheckbox() {
        let locator = this.allDependantsCheckbox + '//label';
        return await this.getText(locator);
    }

    async getNumberOfInvalidItems() {
        let locator = XPATH.container + XPATH.dialogStateBarDiv + "//span[contains(.,'Invalid item(s)')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getAttribute(locator, 'data-count');
    }

    // dependant controls:
    async waitForHideExcludedItemsButtonNotDisplayed() {
        return await this.dependantsControls.waitForHideExcludedItemsButtonNotDisplayed();
    }

    async waitForHideExcludedItemsButtonDisplayed() {
        return await this.dependantsControls.waitForHideExcludedItemsButtonDisplayed();
    }

    async clickOnHideExcludedItemsButton() {
        return await this.dependantsControls.clickOnHideExcludedItemsButton();
    }

    async clickOnShowExcludedItemsButton() {
        return await this.dependantsControls.clickOnShowExcludedItemsButton()
    }

    async waitForShowExcludedItemsButtonDisplayed() {
        return await this.dependantsControls.waitForShowExcludedItemsButtonDisplayed();
    }

    async waitForShowExcludedItemsButtonNotDisplayed() {
        return await this.dependantsControls.waitForShowExcludedItemsButtonNotDisplayed();
    }

    async waitForAllDependantsCheckboxDisplayed() {
        return await this.dependantsControls.waitForAllDependantsCheckboxDisplayed();
    }

    async waitForAllDependantsCheckboxDisabled() {
        return await this.dependantsControls.waitForAllDependantsCheckboxDisabled();
    }

    async waitForAllDependantsCheckboxEnabled() {
        return await this.dependantsControls.waitForAllDependantsCheckboxEnabled();
    }

    waitForAllDependantsCheckboxNotDisplayed() {
        return this.waitForElementNotDisplayed(this.allDependantsCheckbox, appConst.mediumTimeout);
    }

    async clickOnAllCheckbox() {
        return await this.dependantsControls.clickOnAllCheckbox();
    }

    async isAllDependantsCheckboxSelected() {
        return await this.dependantsControls.isAllDependantsCheckboxSelected();
    }

    async isDependantCheckboxSelected(displayName) {
        return await this.dependantsControls.isDependantCheckboxSelected(displayName);
    }

    async isDependantCheckboxEnabled(displayName) {
        return await this.dependantsControls.isDependantCheckboxEnabled(displayName);
    }

    async waitForApplySelectionButtonDisplayed() {
        return await this.dependantsControls.waitForApplySelectionButtonDisplayed();
    }

    async waitForApplySelectionButtonNotDisplayed() {
        return await this.dependantsControls.waitForApplySelectionButtonNotDisplayed();
    }

    async clickOnApplySelectionButton() {
        return await this.dependantsControls.clickOnApplySelectionButton();
    }

    async clickOnCancelSelectionButton() {
        return await this.dependantsControls.clickOnCancelSelectionButton();
    }

    async clickOnCheckboxInDependentItem(displayName) {
        return this.dependantsControls.clickOnCheckboxInDependentItem(displayName);
    }

    async clickOnDependantItemAndSwitchToWizard(displayName) {
        return await this.dependantsControls.clickOnDependantItemAndSwitchToWizard(displayName);
    }

}

module.exports = ContentPublishDialog;
