/**
 * Created  on 3/1/2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const PrincipalComboBox = require('../components/selectors/principal.combobox.dropdon');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');
const DependantsControls = require('./dependant.controls');

const XPATH = {
    container: `//div[contains(@id,'CreateIssueDialog')]`,
    dialogTitle: "//div[contains(@id,'DefaultModalDialogHeader') and child::h2[@class='title']]",
    createIssueButton: `//button[contains(@class,'dialog-button') and child::span[contains(.,'Create Issue')]]`,
    titleFormItem: "//div[contains(@id,'FormItem') and descendant::span[@class='label-text' and text()='Title']]",
    addItemsButton: "//button[contains(@id,'Button') and child::span[text()='Add items']]",
    dependantList: "//ul[contains(@id,'PublishDialogDependantList')]",
    dependentItemToPublish: displayName => `//div[contains(@id,'StatusCheckableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    selectionItemByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::span[contains(@class,'display-name') and text()='${text}']]`,
};

class CreateIssueDialog extends Page {

    constructor() {
        super();
        this.dependantsControls = new DependantsControls(XPATH.container);
    }

    get cancelTopButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get cancelButton() {
        return XPATH.container + lib.dialogButton('Cancel');
    }

    get titleInputValidationMessage() {
        return XPATH.container + XPATH.titleFormItem + lib.VALIDATION_RECORDING_VIEWER;
    }

    get titleInput() {
        return XPATH.container + XPATH.titleFormItem + lib.TEXT_INPUT;
    }

    get addItemsButton() {
        return XPATH.container + XPATH.addItemsButton;
    }

    get descriptionTextArea() {
        return XPATH.container + lib.TEXT_AREA;
    }

    get createIssueButton() {
        return XPATH.container + XPATH.createIssueButton;
    }

    getDialogTitle() {
        return this.getText(XPATH.container + XPATH.dialogTitle);
    }

    get showExcludedItemsButton() {
        return XPATH.container + lib.togglerButton('Show excluded');
    }

    get hideExcludedItemsButton() {
        return XPATH.container + lib.togglerButton('Hide excluded');
    }

    async clickOnCreateIssueButton() {
        try {
            await this.waitForElementEnabled(this.createIssueButton, appConst.shortTimeout);
            await this.clickOnElement(this.createIssueButton);
            await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_create_issue_btn');
            throw new Error('create issue dialog: ' + screenshot + ' ' + err);
        }
    }

    waitForAddItemsButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.addItemsButton);
    }

    waitForAddItemsButtonDisplayed() {
        return this.waitForElementDisplayed(this.addItemsButton);
    }

    async clickOnAddItemsButton() {
        try {
            await this.clickOnElement(this.addItemsButton)
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_click_add_items');
            throw new Error('Error occurred in Create Issue dialog - screenshot' + screenshot + '  ' + err);
        }
    }

    async clickOnCancelButton() {
        try {
            await this.clickOnElement(this.cancelButton);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot('err_close_issue_dialog');
            throw new Error('Create Issue dialog, Error during Clicking on Cancel button, ' + err);
        }
    }

    async clickOnIncludeChildrenToggler(contentName) {
        try {
            let selector = XPATH.container + XPATH.selectionItemByDisplayName(contentName) + lib.INCLUDE_CHILDREN_TOGGLER;
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            await this.clickOnElement(selector);
            await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_include_children');
            throw new Error("Error when clicking on 'include children' icon , screenshot:" + screenshot + '  ' + err);
        }
    }

    getValidationMessageForTitleInput() {
        return this.getText(this.titleInputValidationMessage);
    }

    // Insert text in Issue title input
    typeTitle(issueName) {
        return this.typeTextInInput(this.titleInput, issueName).catch(err => {
            this.saveScreenshot("err_type_issue_name");
            throw new Error('error when type the issue-name ' + err);
        })
    }

    clickOnCancelTopButton() {
        return this.clickOnElement(this.cancelTopButton);
    }

    async waitForDialogLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
            await this.pause(2000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_create_issue_loaded');
            throw new Error('Create issue dialog: ' + screenshot + ' ' + err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout);
    }

    isWarningMessageDisplayed() {
        return this.isElementDisplayed(this.warningMessage);
    }

    isTitleInputDisplayed() {
        return this.isElementDisplayed(this.titleInput);
    }

    isCreateIssueButtonDisplayed() {
        return this.isElementDisplayed(this.createIssueButton);
    }

    isCancelButtonTopDisplayed() {
        return this.isElementDisplayed(this.cancelTopButton);
    }

    isCancelButtonBottomDisplayed() {
        return this.isElementDisplayed(this.cancelButton);
    }

    isAddItemsButtonDisplayed() {
        return this.isElementDisplayed(this.addItemsButton);
    }

    isDescriptionTextAreaDisplayed() {
        return this.isElementDisplayed(this.descriptionTextArea);
    }

    async isItemsOptionFilterDisplayed() {
        let contentSelector = new ContentSelectorDropdown();
        return await contentSelector.isOptionsFilterInputDisplayed(XPATH.container)
    }

    async isAssigneesOptionFilterDisplayed() {
        let principalComboBox = new PrincipalComboBox();
        return await principalComboBox.isOptionsFilterInputDisplayed(XPATH.container);
    }

    async selectUserInAssignees(userName) {
        try {
            let principalComboBox = new PrincipalComboBox();
            await principalComboBox.selectFilteredUser(userName, this.container);
            await principalComboBox.clickOnApplySelectionButton(this.container);
        } catch (err) {
            throw new Error("Error occurred in Create issue Dialog  " + err);
        }
    }

    async selectItemsInContentCombobox(contentName) {
        try {
            let contentSelector = new ContentSelectorDropdown();
            return await contentSelector.selectFilteredByDisplayNameContentMulti(contentName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_items_combo');
            throw new Error("Error in Create issue Dialog, items combobox, screenshot:  " + screenshot + ' ' + err);
        }
    }

    async waitForHideExcludedItemsButtonDisplayed() {
        try {
            return this.waitForElementDisplayed(this.hideExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_excluded_btn');
            throw new Error(`'Hide excluded items' button should be visible! screenshot: ${screenshot} ` + err)
        }
    }

    async clickOnShowExcludedItemsButton() {
        try {
            await this.waitForShowExcludedItemsButtonDisplayed();
            await this.clickOnElement(this.showExcludedItemsButton);
            await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_excluded_btn');
            throw new Error('Create Issue dialog, Show Excluded button, screenshot  ' + screenshot + ' ' + err);
        }
    }

    async waitForShowExcludedItemsButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_excluded_btn');
            throw new Error(`Create Issue, 'Show excluded button' should be visible! screenshot: ${screenshot} ` + +err)
        }
    }

    async waitForShowExcludedItemsButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_excluded_should_be_hidden');
            throw new Error(`'Show excluded items' button should not be visible! screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnHideExcludedItemsButton() {
        try {
            await this.waitForHideExcludedItemsButtonDisplayed();
            await this.clickOnElement(this.hideExcludedItemsButton);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_excluded_btn');
            throw new Error('Create issue dialog, Hide Excluded button, screenshot  ' + screenshot + ' ' + err);
        }
    }

    async waitForHideExcludedItemsButtonNotDisplayed() {
        try {
            return this.waitForElementNotDisplayed(this.hideExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_excluded_btn');
            throw new Error(`'Hide excluded items' button should be hidden! screenshot: ${screenshot} ` + +err)
        }
    }

    async getDisplayNameInDependentItems() {
        let locator = XPATH.container + XPATH.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER + lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(locator);
    }

    async isDependantCheckboxSelected(displayName) {
        return await this.dependantsControls.isDependantCheckboxSelected(displayName);
    }

    async waitForDependenciesListDisplayed() {
        let locator = XPATH.container + XPATH.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER;
        return await this.waitForElementDisplayed(locator);
    }

    async waitForDependenciesListNotDisplayed() {
        try {
            let locator = XPATH.container + XPATH.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER;
            return await this.waitForElementNotDisplayed(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dependencies_list');
            throw new Error(`Dependencies list should not be visible! screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnCheckboxInDependentItem(displayName) {
        return await this.dependantsControls.clickOnCheckboxInDependentItem(displayName);
    }

    async isDependantCheckboxEnabled(displayName) {
        return await this.dependantsControls.isDependantCheckboxEnabled(displayName);
    }

    async waitForAllDependantsCheckboxDisplayed() {
        return await this.dependantsControls.waitForAllDependantsCheckboxDisplayed();
    }

    async waitForAllDependantsCheckboxNotDisplayed() {
        return await this.dependantsControls.waitForAllDependantsCheckboxNotDisplayed();
    }
}

module.exports = CreateIssueDialog;
