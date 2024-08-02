const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const DateTimeRange = require('../page_objects/components/datetime.range');
const DependantsControls = require('./issue/dependant.controls');
const DateTimePickerPopup = require('../page_objects/wizardpanel/time/date.time.picker.popup');

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
    dependentItemToPublish: displayName => `//div[contains(@id,'StatusCheckableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    dependentItemContentStatus: displayName => `//div[contains(@id,'StatusCheckableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    contentStatus: displayName => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]/div[contains(@class,'status')][2]`,
    removeItemIconByName: name => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]//div[@class='icon remove']`,
    excludedItemsNote: "//span[@class='excluded-items-note']",
    publishChangeLogInput: "//input[contains(@placeholder,'Describe changes that will')]",
};

class ContentPublishDialog extends Page {

    constructor() {
        super();
        this.dependantsControls = new DependantsControls(XPATH.container);
    }

    get applySelectionButton() {
        return XPATH.container + lib.DEPENDANTS.EDIT_ENTRY + lib.actionButton('Apply');
    }

    get cancelSelectionButton() {
        return XPATH.container + lib.DEPENDANTS.EDIT_ENTRY + lib.actionButton('Cancel');
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

    get showExcludedItemsButton() {
        return XPATH.container + lib.togglerButton('Show excluded');
    }

    get hideExcludedItemsButton() {
        return XPATH.container + lib.togglerButton('Hide excluded');
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

    // Invalid item(s) Exclude button:
    get excludeInvalidItemsButton() {
        return XPATH.container + XPATH.invalidStateEntryDiv + lib.PUBLISH_DIALOG.EXCLUDE_BTN;
    }

    // In progress() Exclude button:
    get excludeItemsInProgressButton() {
        return XPATH.container + XPATH.inProgressStateEntryDiv + lib.PUBLISH_DIALOG.EXCLUDE_BTN;
    }

    getContainerXpath() {
        return XPATH.container;
    }

    get allDependantsCheckbox() {
        return XPATH.container + lib.checkBoxDiv('All');
    }

    async clickOnLogMessageLink() {
        await this.waitForElementDisplayed(this.logMessageLink, appConst.mediumTimeout);
        return await this.clickOnElement(this.logMessageLink);
    }

    typeTextInLogMessageInput(text) {
        let locator = XPATH.container + XPATH.publishChangeLogInput;
        return this.typeTextInInput(locator, text);
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

    // Wait for the button - In progress() Exclude  is not displayed:
    async waitForExcludeItemsInProgressButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.excludeItemsInProgressButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_exclude_items_in_progress');
            throw new Error(`Exclude items in progress button should not be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    waitForExcludeItemsInProgressButtonDisplayed() {
        return this.waitForElementDisplayed(this.excludeItemsInProgressButton, appConst.mediumTimeout);
    }

    async waitForCancelSelectionButtonDisplayed() {
        return await this.dependantsControls.waitForCancelSelectionButtonDisplayed();
    }

    async waitForApplySelectionButtonDisplayed() {
        return await this.dependantsControls.waitForApplySelectionButtonDisplayed();
    }

    async waitForApplySelectionButtonNotDisplayed() {
        return await this.dependantsControls.waitForApplySelectionButtonNotDisplayed();
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

    async waitForAllDependantsCheckboxNotDisplayed() {
        return await this.dependantsControls.waitForAllDependantsCheckboxNotDisplayed();
    }

    async clickOnAllDependantsCheckbox() {
        return await this.dependantsControls.clickOnAllDependantsCheckbox();
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
            await this.pause(400);
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
        try {
            await this.waitForElementDisplayed(this.publishNowButton, appConst.mediumTimeout);
            await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_open_publish_dialog');
            throw new Error('Publish dialog should be loaded, screenshot: ' + screenshot + "  " + err);
        }
    }

    async waitForDialogClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container, appConst.longTimeout);
            await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_close_publish_dialog');
            throw new Error('Publish dialog must be closed, screenshot: ' + screenshot + "  " + err);
        }
    }

    async clickOnPublishNowButton() {
        try {
            await this.waitForElementEnabled(this.publishNowButton, appConst.longTimeout);
            await this.clickOnElement(this.publishNowButton);
            return await this.pause(1000);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_click_on_publish_button');
            throw new Error(`Error occurred after clicking on 'Publish Now' button ` + err);
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
            let screenshot = await this.saveScreenshotUniqueName('err_publish_dialog_schedule_button');
            throw new Error(`Error, Publish Wizard, 'Add Schedule' icon-button, screenshot:  ` + screenshot + ' ' + err);
        }
    }

    // Verifies that schedule button is enabled then clicks on it:
    async clickOnScheduleButton() {
        try {
            await this.waitForScheduleButtonEnabled();
            await this.clickOnElement(this.scheduleButton);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_dialog_schedule_button');
            throw new Error('Error when clicking on Schedule button  ' + err);
        }
    }

    waitForScheduleButtonEnabled() {
        return this.waitForElementEnabled(this.scheduleButton, appConst.mediumTimeout);
    }

    waitForScheduleButtonDisabled() {
        return this.waitForElementDisabled(this.scheduleButton, appConst.mediumTimeout);
    }

    async clickOnShowExcludedItemsButton() {
        try {
            await this.waitForShowExcludedItemsButtonDisplayed();
            await this.clickOnElement(this.showExcludedItemsButton);
            await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_excluded_btn');
            throw new Error('Error after clicking on Show Excluded dependent items, screenshot  ' + screenshot + ' ' + err);
        }
    }

    async clickOnHideExcludedItemsButton() {
        try {
            await this.waitForHideExcludedItemsButtonDisplayed();
            await this.clickOnElement(this.hideExcludedItemsButton);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_excluded_btn');
            throw new Error('Error after clicking on Hide Excluded dependent items, screenshot  ' + screenshot + ' ' + err);
        }
    }

    async waitForShowExcludedItemsButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_excluded_btn');
            throw new Error(`'Show excluded items' button should be visible! screenshot: ${screenshot} ` + err)
        }
    }

    async waitForShowExcludedItemsButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_excluded_btn');
            throw new Error(`'Show excluded items' button should not be visible! screenshot: ${screenshot} ` + err)
        }
    }

    async waitForHideExcludedItemsButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.hideExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_excluded_btn');
            throw new Error(`'Hide excluded items' button should be visible! screenshot: ${screenshot} ` + err)
        }
    }

    async waitForHideExcludedItemsButtonNotDisplayed() {
        try {
            return this.waitForElementNotDisplayed(this.hideExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_excluded_btn');
            throw new Error(`'Hide excluded items' button should be hidden! screenshot: ${screenshot} ` + err)
        }
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
            let screenshot = await this.saveScreenshotUniqueName('publish_now_disabled');
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
        let dateTimeRange = new DateTimeRange(XPATH.container);
        await dateTimeRange.typeOnlineFrom(dateTime);
        return await this.pause(300);
    }

    async showOnlineToPickerPopup() {
        let dateTimeRange = new DateTimeRange(XPATH.container);
        await dateTimeRange.showOnlineToPickerPopup();
    }

    async showOnlineFormPickerPopup() {
        let dateTimeRange = new DateTimeRange(XPATH.container);
        await dateTimeRange.showOnlineFromPickerPopup();
    }

    async typeInOnlineTo(dateTime) {
        let dateTimeRange = new DateTimeRange(XPATH.container);
        await dateTimeRange.typeOnlineTo(dateTime);
        return await this.pause(300);
    }

    async clickOnOkInPickerPopup() {
        let dateTimePickerPopup = new DateTimePickerPopup();
        await dateTimePickerPopup.clickOnOkButton();
    }

    async getNumberItemsToPublish() {
        let selector = XPATH.container + `//button[contains(@id,'ActionButton')]/span[contains(.,'Publish Now')]`;
        let number = await this.getText(selector);
        let startIndex = number.indexOf('(');
        if (startIndex === -1) {
            throw new Error("Content Publish Dialog - error when get a number in  'Publish now' button  ");
        }
        let endIndex = number.indexOf(')');
        if (endIndex === -1) {
            throw new Error("Content Publish Dialog - error when get a number in  'Publish now' button ");
        }
        return number.substring(startIndex + 1, endIndex);
    }

    async clickOnCheckboxInDependentItem(displayName) {
        return await this.dependantsControls.clickOnCheckboxInDependentItem(displayName);
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

    async clickOnDependantItemAndSwitchToWizard(displayName) {
        let selector = XPATH.publishItemList + XPATH.dependentItemToPublish(displayName);
        await this.clickOnElement(selector);
        await this.pause(1000);
        return await this.getBrowser().switchWindow(displayName);
    }

    async getDisplayNameInDependentItems() {
        return await this.dependantsControls.getDisplayNameInDependentItems();
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

    async clickOnApplySelectionButton() {
        return await this.dependantsControls.clickOnApplySelectionButton();
    }

    async clickOnCancelSelectionButton() {
        return await this.dependantsControls.clickOnCancelSelectionButton();
    }

    async waitForExcludedNote() {
        let locator = XPATH.container + XPATH.excludedItemsNote;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return this.getText(locator);
    }

    async getNumberInAllCheckbox() {
        return await this.dependantsControls.getNumberInAllCheckbox();
    }

    async getNumberOfInvalidItems() {
        let locator = XPATH.container + XPATH.dialogStateBarDiv + "//span[contains(.,'Invalid item(s)')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getAttribute(locator, 'data-count');
    }
}

module.exports = ContentPublishDialog;
