const Page = require('../page');
const appConst = require('../../libs/app_const');
const {BUTTONS, DIALOG_ITEMS, SELECTION_STATUS_BAR} = require('./../../libs/elements');
const AssigneeSelectorDropdown = require('../components/selectors/assignee.selector.dropdown');
const DependantsControls = require('./dependant.controls');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');
const DiffStatusBadge = require('../components/diff.status.badge');

const xpath = {
    container: `//div[@data-component='RequestPublishDialogContent']`,
    titleInput: "//div[descendant::div[text()='Title']]/following-sibling::div[1]//input[contains(@class,'text')]",
    commentTextArea: "//div[descendant::div[text()='Add a comment']]/following-sibling::div[1]//textarea",
    invalidItemsDiv: "//div[@data-component='SelectionStatusBar' and descendant::span[contains(.,'Invalid items')]]",
    mainItemDivByName: name => DIALOG_ITEMS.PRIMARY_DATA_COMPONENT + DIALOG_ITEMS.mainItemRowByName(name),
    dependantItemDivByName: name => DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV + DIALOG_ITEMS.mainItemRowByName(name),
    warningMessagePart1: "//div[contains(@id,'PublishIssuesStateBar')]/span[@class='part1']",
    warningMessagePart2: "//div[contains(@id,'PublishIssuesStateBar')]/span[@class='part2']",
    invalidIcon: "//span[contains(@class,'icon-state-invalid')]",
    errorEntry: "//div[contains(@id,'DialogStateEntry') and contains(@class,'error-entry')]",
    inProgressEntryDiv: "//div[contains(@id,'DialogStateEntry') and descendant::span[contains(@class,'icon-state-in-progress')]]",
    invalidEntryDiv: "//div[contains(@id,'DialogStateEntry') and descendant::span[contains(@class,'icon-state-invalid')]]",

};
// Modal Dialog for creating of new publish request
// Select a content then expand Publish menu and click on 'Request Publishing' menu item
class CreateRequestPublishDialog extends Page {

    constructor() {
        super();
        this.dependantsControls = new DependantsControls(xpath.container);
    }

    get container() {
        return xpath.container;
    }

    get dependantsBlock() {
        return xpath.container + DIALOG_ITEMS.SECONDARY_DATA_COMPONENT_DIV;
    }

    get invalidIcon() {
        return xpath.container + xpath.invalidEntryDiv + xpath.invalidIcon;
    }

    get closeButton() {
        return xpath.container + BUTTONS.buttonAriaLabel('Close');
    }

    get markAsReadyButton() {
        return xpath.container + SELECTION_STATUS_BAR.buttonByLabel('Mark as ready');
    }

    get excludeItemsInProgressButton() {
        return xpath.container + SELECTION_STATUS_BAR.buttonByLabel('Exclude');
    }

    get excludeInvalidItemsButton() {
        return xpath.container + xpath.invalidItemsDiv + SELECTION_STATUS_BAR.buttonByLabel('Exclude');
    }

    get createRequestButton() {
        return xpath.container + BUTTONS.buttonByLabel('Create request');
    }

    get titleInput() {
        return xpath.container + xpath.titleInput;
    }

    get commentTextArea() {
        return xpath.container + xpath.commentTextArea;
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
            await this.handleError(`Dependencies block should be displayed`, 'err_dependencies_block', err);
        }
    }

    async clickOnCloseButton() {
        await this.clickOnElement(this.closeButton);
        return await this.waitForDialogClosed();
    }

    // dialog-state-bar:
    async waitForMarkAsReadyButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.markAsReadyButton);
        } catch (err) {
            await this.handleError(`Request Publishing, Mark as ready button should be visible`, 'err_mark_as_ready_btn', err);
        }
    }

    // dialog-state-bar
    async waitForMarkAsReadyButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.markAsReadyButton);
        } catch (err) {
            await this.handleError(`Request Publishing, Mark as ready button should be not visible`, 'err_mark_as_ready_btn', err);
        }
    }

    // dialog-state-bar
    waitForExcludeItemsInProgressButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.excludeItemsInProgressButton);
    }

    // dialog-state-bar
    waitForExcludeItemsInProgressButtonDisplayed() {
        return this.waitForElementDisplayed(this.excludeItemsInProgressButton);
    }

    // dialog-state-bar
    async clickOnExcludeItemsInProgressButton() {
        await this.waitForElementDisplayed(this.excludeItemsInProgressButton);
        await this.clickOnElement(this.excludeItemsInProgressButton);
        return await this.pause(500);
    }

    // dialog-state-bar
    async clickOnExcludeInvalidItemsButton() {
        await this.waitForElementDisplayed(this.excludeInvalidItemsButton);
        await this.clickOnElement(this.excludeInvalidItemsButton);
        return await this.pause(500);
    }


    // return the value of 'aria-disabled' attribute, if the button is disabled it should return 'true', otherwise 'false'
    async isRemoveItemIconDisabled(name) {
        try {
            let locator = xpath.container + DIALOG_ITEMS.mainItemDivByName(name) + DIALOG_ITEMS.CONTENT_REMOVE_BUTTON;
            await this.waitForElementDisplayed(locator);
            let attr = await this.getAttribute(locator, 'aria-disabled');
            return attr;
        } catch (err) {
            await this.handleError(`Publish Dialog, tried to check the remove icon for item ${name} `, 'err_remove_item_icon', err);
        }
    }

    async clickOnDropDownHandleInItemsToPublishCombobox() {
        try {
            let contentSelector = new ContentSelectorDropdown(this.container);
            await contentSelector.clickOnDropdownHandle();
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Request Publish Dialog tried to click on items to publish dropdown handle',
                'err_click_items_to_publish_dropdown', err);
        }
    }

    async clickOnExpanderIconInOptionsList(optionName) {
        let contentSelector = new ContentSelectorDropdown(xpath.container);
        return await contentSelector.clickOnExpanderIconInOptionsList(optionName);
    }

    //
    async clickOnMainItemAndSwitchToWizard(contentName) {
        let selector = xpath.container + xpath.mainItemDivByName(contentName);
        await this.clickOnElement(selector);
        await this.pause(900);
        return await this.getBrowser().switchWindow(contentName);
    }

    async clickOnDependantItemAndSwitchToWizard(contentName) {
        let selector = xpath.container + xpath.dependantItemDivByName();
        await this.clickOnElement(selector);
        await this.pause(900);
        return await this.getBrowser().switchWindow(contentName);
    }

    async waitForDialogLoaded() {
        await this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout);
        await this.pause(1000);
    }

    waitForNextButtonDisplayed() {
        return this.waitForElementDisplayed(this.nextButton, appConst.mediumTimeout);
    }

    async waitForInvalidIconDisplayed() {
        try {
            await this.waitForElementDisplayed(this.invalidIcon, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Request Publishing dialog:  'invalid' icon should be visible`,
                'err_request_publish_dialog_invalid_icon', err)
        }
    }

    async waitForInvalidIconNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.invalidIcon, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Request Publishing dialog:  'invalid' icon should be not visible`,
                'err_request_publish_dialog_invalid_icon', err);
        }
    }

    async waitForDialogClosed() {
        let message = 'Request publish Dialog was not closed! timeout is ' + appConst.mediumTimeout;
        await this.getBrowser().waitUntil(async () => {
            return await this.isElementNotDisplayed(xpath.container);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: message});
        return await this.pause(400);
    }

    async waitForCreateRequestButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.createRequestButton, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Request Publishing dialog - Create Request button should be disabled', 'err_create_request_btn', err);
        }
    }

    async waitForCreateRequestButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.createRequestButton);
        } catch (err) {
            await this.handleError('Request Publishing - Create Request button should be enabled', 'err_create_request_btn', err);
        }
    }

    // getContentStatus(name) {
    //     let selector = xpath.contentStatus(name);
    //     return this.getText(selector);
    // }

    async selectUserInAssignees(userName) {
        try {
            let principalComboBox = new PrincipalComboBox(this.container);
            await principalComboBox.selectFilteredUser(userName);
            await principalComboBox.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(`Error when selecting user in Assignees combobox: ${userName}`, 'err_select_user_assignees', err);
        }
    }

    async clickOnDropDownHandleInAssigneesCombobox() {
        try {
            let principalComboBox = new AssigneeSelectorDropdown(this.container);
            await principalComboBox.clickOnDropdownHandle();
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Request Publish Dialog tried to click on Assignees button', 'err_click_assignees_btn', err);
        }
    }

    // TODO: Refactor this method for epic-enonic-ui
    async getOptionsInAssigneesDropdownList() {
        let principalComboBox = new AssigneeSelectorDropdown(xpath.container);
        return await principalComboBox.getPrincipalsDisplayNameInOptions();
    }


    async clickOnIncludeChildItems(name) {
        try {
            let includeIcon = DIALOG_ITEMS.mainItemDivByName(name) + DIALOG_ITEMS.INCLUDE_CHILDREN_CHECKBOX;
            await this.waitForElementDisplayed(includeIcon, appConst.mediumTimeout);
            await this.clickOnElement(includeIcon);
            return await this.pause(1000);
        } catch (err) {
            throw new Error('Request Publishing dialog- error when clicking on `Include Child items`: ' + err)
        }
    }

    async getContentStatus(contentName) {
        const rowXpath = xpath.container + xpath.mainItemDivByName(contentName);
        const diffStatusBadge = new DiffStatusBadge(rowXpath);
        return await diffStatusBadge.getStatusText();
    }

    // Returns 'ready', 'in-progress', or '' — read from aria-label of the SVG icon inside ContentLabel
    async getWorkflowIconState(contentName) {
        const rowXpath = xpath.container + xpath.mainItemDivByName(contentName);
        const diffStatusBadge = new DiffStatusBadge(rowXpath);
        return await diffStatusBadge.getWorkflowIconState();
    }

    async getDependantWorkflowState(contentName) {
        const rowXpath = xpath.container + xpath.dependantItemDivByName(contentName);
        const diffStatusBadge = new DiffStatusBadge(rowXpath);
        return await diffStatusBadge.getStatusText();
    }

    // Returns 'ready', 'in-progress', or '' for a dependant item
    async getDependantWorkflowIconState(contentName) {
        const rowXpath = xpath.container + xpath.dependantItemDivByName(contentName);
        const diffStatusBadge = new DiffStatusBadge(rowXpath);
        return await diffStatusBadge.getWorkflowIconState();
    }

    isWarningMessageDisplayed() {
        return this.isElementDisplayed(this.warningMessagePart1);
    }

    async typeTextInCommentTextarea(text) {
        try {
            await this.waitForElementDisplayed(this.commentTextArea);
            return await this.typeTextInInput(this.commentTextArea, text);
        } catch (err) {
            await this.handleError('Request Publish Dialog - Tried to type a text in Comment textarea', 'err_comment_text_area', err);
        }
    }

    async typeInTitleInput(title) {
        try {
            await this.waitForElementDisplayed(this.titleInput);
            return await this.typeTextInInput(this.titleInput, title);
        } catch (err) {
            await this.handleError('Request Publish Dialog - Tried to type in Title input', 'err_type_title_input', err);
        }
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
            await this.handleError('Request Publish Dialog tried to click on Mark as ready  button', 'err_click_mark_as_ready_btn', err);
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

