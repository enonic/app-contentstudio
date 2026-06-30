const Page = require('./page');
const appConst = require('../libs/app_const');
const {BUTTONS, DIALOG_ITEMS, COMMON, LIVE_VIEW, WIZARD} = require('../libs/elements');
const DateTimeRange = require('../page_objects/components/datetime.range');
const DependantsControls = require('./issue/dependant.controls');
const DateTimePickerPopup = require('../page_objects/wizardpanel/time/date.time.picker.popup');
const DiffStatusBadge = require('./components/diff.status.badge');

const XPATH = {
    container: "//div[contains(@role,'dialog') and descendant::h2[contains(.,'Publishing Wizard')]]",
    dialogTitle: "//h2[text()='Publishing Wizard']",
    dialogStateBarDiv: "//div[contains(@id,'DialogStateBar')]",
    logMessageLink: "//div[contains(@class,'content-dialog-sub-title')]/a",
    publishScheduleForm: "//div[@data-component='PublishScheduleForm']",
    includeChildrenCheckbox: DIALOG_ITEMS.PRIMARY_DATA_COMPONENT +
                             "//div[@data-component='Checkbox' and descendant::span[contains(.,'Include child')]]//label",
    checkableDependentItemDiv: `//div[contains(@id,'StatusCheckableItem')`,
    removeItemIcon: `//div[contains(@class,'icon remove')]`,
    publishItemList: "//ul[contains(@id,'PublishDialogItemList')]",
    changeLogInput: "//input[contains(@id,'AutosizeTextInput')]",
    dependantList: "//ul[contains(@id,'PublishDialogDependantList')]",
    readyForPublishingText: "//div[@data-component='StatusBarEntry']//span[text()='Content is ready for publishing']",
    mainItemDivByName: name => DIALOG_ITEMS.PRIMARY_DATA_COMPONENT + DIALOG_ITEMS.mainItemRowByName(name),
    selectionStatusBar: "//div[@data-component='SelectionStatusBar']",
    inProgressStateEntryDiv: "//div[@data-component='SelectionStatusBar']//div[@data-component='StatusBarErrorEntry' and descendant::*[@data-component='StatusIcon' and @aria-label='in-progress']]",
    invalidStateEntryDiv: "//div[@data-component='SelectionStatusBar']//div[@data-component='StatusBarErrorEntry' and descendant::*[@data-component='StatusIcon' and @aria-label='invalid']]",
    inProgressSpan: "//span[contains(@class,'entry-text') and text()='In progress']",
    dependentItemToPublish: displayName => `//div[contains(@id,'StatusCheckableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    excludedItemsNote: "//span[@class='excluded-items-note']",
    publishChangeLogInput: "//input[contains(@placeholder,'Describe changes that will')]",
};

class ContentPublishDialog extends Page {

    constructor() {
        super();
        this.dependantsControls = new DependantsControls(XPATH.container);
    }

    get cancelSelectionButton() {
        return XPATH.container + lib.DEPENDANTS.EDIT_ENTRY + lib.actionButton('Cancel');
    }

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }


    get changeLogInput() {
        return XPATH.container + XPATH.changeLogInput;
    }

    get showExcludedItemsButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Show excluded');
    }

    get hideExcludedItemsButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Hide excluded');
    }

    get logMessageLink() {
        return XPATH.container + XPATH.logMessageLink;
    }

    get publishNowButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Publish now');
    }

    get updateScheduledButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Update Scheduled');
    }

    get addScheduleButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Schedule');
    }

    get confirmScheduleButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Confirm schedule');
    }

    get includeChildrenCheckbox() {
        return XPATH.container + XPATH.includeChildrenCheckbox;
    }

    get markAsReadyButton() {
        return XPATH.container + XPATH.inProgressStateEntryDiv + BUTTONS.buttonByLabel('Mark as ready');
    }

    // Invalid item(s) Exclude button:
    get excludeInvalidItemsButton() {
        return XPATH.container + XPATH.invalidStateEntryDiv + "//button[@data-component='StatusBarEntryButton' and text()='Exclude']";
    }

    // In progress() Exclude button:
    get excludeItemsInProgressButton() {
        return XPATH.container + XPATH.inProgressStateEntryDiv + "//button[@data-component='StatusBarEntryButton' and text()='Exclude']";
    }

    get applyButton() {
        return XPATH.container + "//button[@data-component='StatusBarEntryButton' and text()='Apply']";
    }

    get cancelButton() {
        return XPATH.container  + "//button[@data-component='StatusBarEntryButton' and text()='Cancel']";
    }

    getContainerXpath() {
        return XPATH.container;
    }

    get allDependantsCheckbox() {
        return XPATH.container + lib.checkBoxDiv('All');
    }

    async clickOnApplyButton(){
        try {
            await this.waitForElementDisplayed(this.applyButton);
            await this.clickOnElement(this.applyButton);
            await this.pause(1000);
        }catch (err) {
            await this.handleError(`Publish Dialog, click on 'Apply' button `, 'err_apply_button', err);
        }
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
        return await this.dependantsControls.waitForDependantsBlockDisplayed();
    }

    async waitForDependantsBlockNotDisplayed() {
        return await this.dependantsControls.waitForDependantsBlockNotDisplayed();
    }

    waitForExcludeInvalidItemsButtonDisplayed() {
        return this.waitForElementDisplayed(this.excludeInvalidItemsButton);
    }

    waitForExcludeInvalidItemsButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.excludeInvalidItemsButton);
    }

    // Wait for the button - In progress() Exclude  is not displayed:
    async waitForExcludeItemsInProgressButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.excludeItemsInProgressButton);
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Exclude items in progress' button should not be displayed, `,
                'err_exclude_items_in_progress_button', err);
        }
    }

    waitForExcludeItemsInProgressButtonDisplayed() {
        return this.waitForElementDisplayed(this.excludeItemsInProgressButton);
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
        await this.waitForElementDisplayed(this.excludeInvalidItemsButton);
        await this.clickOnElement(this.excludeInvalidItemsButton);
        return await this.pause(500);
    }

    async clickOnExcludeItemsInProgressButton() {
        await this.waitForElementDisplayed(this.excludeItemsInProgressButton);
        await this.clickOnElement(this.excludeItemsInProgressButton);
        return await this.pause(500);
    }

    async waitForMarkAsReadyButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.markAsReadyButton);
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Mark as ready' button should be displayed, `, 'err_mark_as_ready_btn', err);
        }
    }

    async clickOnMarkAsReadyButton() {
        try {
            await this.waitForMarkAsReadyButtonDisplayed();
            await this.pause(700);
            await this.clickOnElement(this.markAsReadyButton);
            return await this.pause(700);
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
            let locator = XPATH.container + XPATH.dialogTitle;
            await this.waitForElementDisplayed(locator);
            await this.pause(1000);
        } catch (err) {
            await this.handleError(`Publish Dialog, dialog should be opened `, 'err_open_publish_dialog', err);
        }
    }

    async waitForDialogClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError(`Publish Dialog, wait for dialog to be closed `, 'err_close_publish_dialog', err);
        }
    }

    async clickOnPublishNowButton() {
        try {
            await this.waitForElementDisplayed(this.publishNowButton);
            await this.waitForElementEnabled(this.publishNowButton, appConst.longTimeout);
            await this.clickOnElement(this.publishNowButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on 'Publish Now' button `, 'err_click_on_publish_now_button', err);
        }
    }

    isIncludeChildToggleDisplayed() {
        return this.isElementDisplayed(this.includeChildrenCheckbox);
    }

    // Click on icon-calendar:
    async clickOnAddScheduleButton() {
        try {
            await this.waitForElementDisplayed(this.addScheduleButton);
            await this.clickOnElement(this.addScheduleButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on 'Add Schedule' icon-button `, 'err_publish_dialog_schedule_button', err);
        }
    }

    // Verifies that schedule button is enabled then clicks on it:
    async clickOnConfirmScheduleButton() {
        try {
            await this.waitForConfirmScheduleButtonEnabled();
            await this.clickOnElement(this.confirmScheduleButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on 'Schedule' button `, 'err_click_on_schedule_button', err);
        }
    }

    waitForConfirmScheduleButtonDisplayed() {
        return this.waitForElementEnabled(this.confirmScheduleButton);
    }

    waitForScheduleButtonNotDisplayed(){
        return this.waitForElementNotDisplayed(this.addScheduleButton);
    }
    waitForScheduleButtonEnabled() {
        return this.waitForElementEnabled(this.addScheduleButton);
    }

    waitForScheduleButtonDisabled() {
        return this.waitForElementDisabled(this.addScheduleButton);
    }

    async waitForConfirmScheduleButtonEnabled() {
        return await this.waitForElementEnabled(this.confirmScheduleButton);
    }

    async waitForConfirmScheduleButtonDisabled() {
        return await this.waitForElementDisabled(this.confirmScheduleButton);
    }

    async clickOnShowExcludedItemsButton() {
        try {
            await this.waitForShowExcludedItemsButtonDisplayed();
            await this.clickOnElement(this.showExcludedItemsButton);
            await this.pause(400);
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
            return await this.waitForElementDisplayed(this.showExcludedItemsButton);
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Show excluded items' button should be visible, `, 'err_show_excluded_btn', err);
        }
    }

    async waitForShowExcludedItemsButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.showExcludedItemsButton);
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Show excluded items' button should not be displayed, `, 'err_show_excluded_btn', err);
        }
    }

    async waitForHideExcludedItemsButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.hideExcludedItemsButton);
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Hide excluded items' button should be displayed, `, 'err_hide_excluded_btn', err);
        }
    }

    async waitForHideExcludedItemsButtonNotDisplayed() {
        try {
            return this.waitForElementNotDisplayed(this.hideExcludedItemsButton);
        } catch (err) {
            await this.handleError(`Publish Dialog, 'Hide excluded items' button should not be displayed, `, 'err_hide_excluded_btn', err);
        }
    }

    async clickOnIncludeChildrenCheckbox() {
        try {
            await this.waitForElementDisplayed(this.includeChildrenCheckbox);
            await this.clickOnElement(this.includeChildrenCheckbox);
            return await this.pause(700);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on Include Children toggle `, 'err_include_children_toggle', err);
        }
    }

    async waitForScheduleButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.addScheduleButton);
        } catch (err) {
            throw new Error("'Schedule' button should be visible!" + err);
        }
    }

    async getContentStatus(contentName) {
        const rowXpath = XPATH.container + XPATH.mainItemDivByName(contentName);
        const diffStatusBadge = new DiffStatusBadge(rowXpath);
        return await diffStatusBadge.getStatusText();
    }

    async getDependantWorkflowState(contentName) {
        const rowXpath = XPATH.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV +
                         DIALOG_ITEMS.contentRowByName(contentName);
        const diffStatusBadge = new DiffStatusBadge(rowXpath);
        return await diffStatusBadge.getStatusText();
    }

    async typeTextInChangeLog(text) {
        await this.keys(text);
        return await this.pause(1000);
    }

    async getTextInChangeLog() {
        await this.waitForExist(this.changeLogInput, appConst.shortTimeout);
        return await this.getTextInInput(this.changeLogInput);
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

    async isRemoveItemIconDisabled(name) {
        try {
            let locator = XPATH.container + XPATH.mainItemDivByName(name) + DIALOG_ITEMS.CONTENT_REMOVE_BUTTON;
            await this.waitForElementDisplayed(locator);
            let attr = await this.getAttribute(locator, 'aria-disabled');
            return attr;
        } catch (err) {
            await this.handleError(`Publish Dialog, tried to check the remove icon for item ${name} `, 'err_remove_item_icon', err);
        }
    }

    async clickOnRemoveItemIcon(name) {
        let locator = XPATH.container + XPATH.mainItemDivByName(name) + DIALOG_ITEMS.CONTENT_REMOVE_BUTTON;
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        await this.clickOnElement(locator);
    }

    async clickOnCloseButton() {
        await this.waitForElementDisplayed(this.closeButton);
        await this.clickOnElement(this.closeButton);
    }

    async typeInOnlineFrom(dateTime) {
        let dateTimeRange = new DateTimeRange(XPATH.container);
        await dateTimeRange.typeOnlineFrom(dateTime);
        return await this.pause(300);
    }

    async getValueInOnlineFrom(dateTime) {
        let dateTimeRange = new DateTimeRange(XPATH.container);
        return await dateTimeRange.getOnlineFrom();
    }

    getOnlineFrom

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
        let selector = this.publishNowButton;
        let text = await this.getText(selector);
        let startIndex = text.indexOf('(');
        if (startIndex === -1) {
            return '';
        }
        let endIndex = text.indexOf(')');
        if (endIndex === -1) {
            return '';
        }
        return text.substring(startIndex + 1, endIndex);
    }

    async clickOnCheckboxInDependentItem(displayName) {
        return await this.dependantsControls.clickOnCheckboxInDependentItem(displayName);
    }

    async getItemsToPublish() {
        //let selector = XPATH.container + XPATH.publishItemList + lib.H6_DISPLAY_NAME;
        let result = await this.getTextInElements(selector);
        return [].concat(result);
    }

    async clickOnMainItemAndSwitchToWizard(displayName) {
        let selector = XPATH.container + XPATH.mainItemDivByName(displayName);
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
        try {
            return await this.dependantsControls.getDisplayNameInDependentItems();
        }catch(err){
            await this.handleError(`Publish Dialog, get display name in dependent items `, 'err_dependent_items_display_name', err);
        }
    }

    async waitForDependenciesListDisplayed() {
        let locator = XPATH.container + XPATH.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER;
        return await this.waitForElementDisplayed(locator);
    }

    async clickOnCancelScheduleFormButton() {
        try {
            let locator = XPATH.container + BUTTONS.buttonAriaLabel('Cancel schedule');
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Publish Schedule Form, close icon `, 'err_close_schedule_form', err);
        }
    }

    async waitForScheduleFormNotDisplayed() {
        let locator = XPATH.container + XPATH.publishScheduleForm;
        return await this.waitForElementNotDisplayed(locator);
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

    getOnlineToScheduleValidationRecord() {
        let dateTimeRange = new DateTimeRange(XPATH.container);
        return dateTimeRange.getOnlineToValidationRecord();
    }

    waitForOnlineToScheduleValidationMessageNotDisplayed() {
        let dateTimeRange = new DateTimeRange(XPATH.container);
        return dateTimeRange.waitForOnlineToValidationRecordingNotDisplayed();
    }

    async waitForOnlineToScheduleValidationMessageDisplayed() {
        try {
            let dateTimeRange = new DateTimeRange(XPATH.container);
            return await dateTimeRange.waitForOnlineToValidationRecording();
        } catch (err) {
            await this.handleError(`Publish Dialog, schedule validation message should be displayed `, 'err_schedule_val_message', err);
        }
    }
    async waitForOnlineFromScheduleValidationMessageDisplayed() {
        try {
            let dateTimeRange = new DateTimeRange(XPATH.container);
            return await dateTimeRange.waitForOnlineFromValidationRecording();
        } catch (err) {
            await this.handleError(`Publish Dialog, schedule validation message should be displayed `, 'err_schedule_val_message', err);
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

    async clickOnUpdateScheduledButton() {
        try {
            await this.clickOnElement(this.updateScheduledButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Publish Dialog, click on 'Update Scheduled' button `, 'err_click_update_scheduled_button', err);
        }
    }

    // Returns 'ready', 'in-progress', or '' — read from aria-label of the SVG icon inside ContentLabel
    async getWorkflowIconState(contentName) {
        const rowXpath = XPATH.container + XPATH.mainItemDivByName(contentName);
        const diffStatusBadge = new DiffStatusBadge(rowXpath);
        return await diffStatusBadge.getWorkflowIconState();
    }
}

module.exports = ContentPublishDialog;
