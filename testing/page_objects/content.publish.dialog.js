const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const DateTimeRange = require('../page_objects/components/datetime.range');
const DependantsControls = require('./issue/dependant.controls');
const DateTimePickerPopup = require('../page_objects/wizardpanel/time/date.time.picker.popup');

const XPATH = {
    container: "//div[contains(@id,'ContentPublishDialog')]",
    dialogTitle: "//h2[text()='Publishing Wizard']",
    dialogStateBarDiv: "//div[contains(@id,'DialogStateBar')]",
    logMessageLink: "//div[contains(@class,'content-dialog-sub-title')]/a",
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

    get updateScheduledButton() {
        return XPATH.container + lib.actionButton('Update Scheduled');
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
        try {
            await this.waitForElementDisplayed(this.logMessageLink, appConst.mediumTimeout);
            return await this.clickOnElement(this.logMessageLink);
        } catch (err) {
            await this.handleError(`Publish Dialog, log message input `, 'err_log_message_input', err);
        }
    }

    typeTextInLogMessageInput(text) {
        let locator = XPATH.container + XPATH.publishChangeLogInput;
        return this.typeTextInInput(locator, text);
    }

    async waitForDependantsBlockDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.dependantsBlock, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Publish Dialog, dependencies block is not displayed, `, 'err_dependencies_block', err);
        }
    }

    async waitForDependantsBlockNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.dependantsBlock, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Publish Dialog, dependencies block should not be displayed, `, 'err_dependencies_block', err);
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
            await this.handleError(`Publish Dialog, 'Exclude items in progress' button should not be displayed, `,
                'err_exclude_items_in_progress_button', err);
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
            await this.handleError(`Publish Dialog, 'Mark as ready' button should be displayed, `, 'err_mark_as_ready_btn', err);
        }
    }

    async clickOnMarkAsReadyButton() {
        try {
            await this.waitForMarkAsReadyButtonDisplayed();
            await this.clickOnElement(this.markAsReadyButton);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on 'Mark as ready' button `, 'err_click_mark_as_ready_btn', err);
        }
    }

    async waitForMarkAsReadyButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.markAsReadyButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Mark as ready' button should not be displayed, `, 'err_mark_as_ready_btn', err);
        }
    }

    async markAsReadyButtonDisplayed() {
        await this.waitForElementDisplayed(this.markAsReadyButton, appConst.mediumTimeout);
        return await this.waitForElementEnabled(this.markAsReadyButton, appConst.mediumTimeout);
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.dialogTitle, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Publish Dialog, dialog should be opened `, 'err_open_publish_dialog', err);
        }
    }

    async waitForDialogClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container, appConst.longTimeout);
        } catch (err) {
            await this.handleError(`Publish Dialog, wait for dialog to be closed `, 'err_close_publish_dialog', err);
        }
    }

    async clickOnPublishNowButton() {
        try {
            await this.waitForElementDisplayed(this.publishNowButton, appConst.mediumTimeout);
            await this.waitForElementEnabled(this.publishNowButton, appConst.longTimeout);
            await this.clickOnElement(this.publishNowButton);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on 'Publish Now' button `, 'err_click_on_publish_now_button', err);
        }
    }

    isIncludeChildToggleDisplayed() {
        return this.isElementDisplayed(this.includeChildrenToogler);
    }

    // Click on icon-calendar:
    async clickOnAddScheduleIcon() {
        try {
            await this.waitForElementDisplayed(this.addScheduleIcon, appConst.shortTimeout);
            await this.clickOnElement(this.addScheduleIcon);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on 'Add Schedule' icon-button `, 'err_publish_dialog_schedule_button', err);
        }
    }

    // Verifies that schedule button is enabled then clicks on it:
    async clickOnScheduleButton() {
        try {
            await this.waitForScheduleButtonEnabled();
            await this.clickOnElement(this.scheduleButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on 'Schedule' button `, 'err_click_on_schedule_button', err);
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
        } catch (err) {
            await this.handleError(`Publish Dialog, click on Show Excluded dependent items button `, 'err_show_excluded_btn', err);
        }
    }

    async clickOnHideExcludedItemsButton() {
        try {
            await this.waitForHideExcludedItemsButtonDisplayed();
            await this.clickOnElement(this.hideExcludedItemsButton);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on Hide Excluded dependent items button `, 'err_hide_excluded_btn', err);
        }
    }

    async waitForShowExcludedItemsButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Show excluded items' button should be visible, `, 'err_show_excluded_btn', err);
        }
    }

    async waitForShowExcludedItemsButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Show excluded items' button should not be displayed, `, 'err_show_excluded_btn', err);
        }
    }

    async waitForHideExcludedItemsButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.hideExcludedItemsButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Hide excluded items' button should be displayed, `, 'err_hide_excluded_btn', err);
        }
    }

    async waitForHideExcludedItemsButtonNotDisplayed() {
        try {
            return this.waitForElementNotDisplayed(this.hideExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Hide excluded items' button should not be displayed, `, 'err_hide_excluded_btn', err);
        }
    }

    async clickOnIncludeChildrenToogler() {
        try {
            await this.waitForElementDisplayed(this.includeChildrenToogler, appConst.mediumTimeout);
            await this.clickOnElement(this.includeChildrenToogler);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on Include Children toggle `, 'err_include_children_toggle', err);
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
        return await this.pause(200);
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

    async waitForAddScheduleIconNotDisplayed() {
        try {
            return this.waitForElementNotDisplayed(this.addScheduleIcon, appConst.shortTimeout)
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Add Schedule' button should not be displayed, `, 'err_add_schedule_icon', err);
        }
    }

    async isLogMessageLinkDisplayed() {
        await this.saveScreenshotUniqueName('publish_dlg_log_message_input');
        return await this.isElementDisplayed(this.logMessageLink, appConst.shortTimeout);
    }

    async waitForPublishNowButtonEnabled() {
        try {
            await this.waitForElementDisplayed(this.publishNowButton, appConst.mediumTimeout);
            return await this.waitForElementEnabled(this.publishNowButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Publish Wizard, 'Publish Now' button should be enabled, `, 'err_publish_now_button_enabled', err);
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

    async clickOnRemoveItemIcon(name) {
        let locator = XPATH.mainItemDivByName(name) + `//div[@class='icon remove']`;
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        await this.clickOnElement(locator);
    }

    async clickOnCancelTopButton() {
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
        try {
            let dateTimePickerPopup = new DateTimePickerPopup();
            await dateTimePickerPopup.clickOnOkButton();
        } catch (err) {
            await this.handleError(`Publish Dialog, click on OK in picker popup `, 'err_picker_popup_ok', err);
        }
    }

    async getNumberItemsToPublish() {
        let selector = XPATH.container + `//button[contains(@id,'ActionButton')]/span[contains(.,'Publish Now')]`;
        let number = await this.getText(selector);
        let startIndex = number.indexOf('(');
        if (startIndex === -1) {
            throw new Error(`Content Publish Dialog - error when get a number in  'Publish now' button  `);
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
            let locator = XPATH.container + XPATH.publishScheduleForm + `//a[contains(@class,'icon-close')]`;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
        } catch (err) {
            await this.handleError(`Publish Schedule Form, close icon `, 'err_close_schedule_form', err);
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
        let locator = XPATH.container + XPATH.dialogStateBarDiv + `//span[contains(.,'Invalid item(s)')]`;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getAttribute(locator, 'data-count');
    }

    getScheduleValidationRecord() {
        let dateTimeRange = new DateTimeRange(XPATH.container);
        return dateTimeRange.getValidationRecord();
    }

    waitForScheduleValidationMessageNotDisplayed() {
        let dateTimeRange = new DateTimeRange(XPATH.container);
        return dateTimeRange.waitForValidationRecordingNotDisplayed();
    }

    async waitForScheduleValidationMessageDisplayed() {
        try {
            let dateTimeRange = new DateTimeRange(XPATH.container);
            return await dateTimeRange.waitForValidationRecording(appConst.shortTimeout);
        } catch (err) {
            await this.handleError(`Publish Dialog, schedule validation message should be displaye `, 'err_schedule_val_message', err);
        }
    }

    async waitForUpdateScheduledButtonDisplayed() {
        await this.waitForElementDisplayed(this.updateScheduledButton, appConst.mediumTimeout);
    }

    async waitForUpdateScheduledButtonEnabled() {
        try {
            await this.waitForElementEnabled(this.updateScheduledButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Update Scheduled' button should be enabled, `, 'err_update_scheduled_button', err);
        }
    }

    async waitForUpdateScheduledButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.updateScheduledButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Update Scheduled' button should be disabled, `, 'err_update_scheduled_button', err);
        }
    }
    async clickOnUpdateScheduledButton(){
        try {
            await this.clickOnElement(this.updateScheduledButton);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on 'Update Scheduled' button `, 'err_click_update_scheduled_button', err);
        }
    }
}

module.exports = ContentPublishDialog;
