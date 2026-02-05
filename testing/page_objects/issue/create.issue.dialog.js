/**
 * Created  on 3/1/2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const {BUTTONS} = require('../../libs/elements');
const PrincipalComboBox = require('../components/selectors/principal.combobox.dropdown');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');
const DependantsControls = require('./dependant.controls');
const IssueItemsSelector = require('../components/selectors/issue.items.selector');

const xpath = {
    container: `//div[contains(@role,'dialog') and @data-component='NewIssueDialogContent']`,
    dialogTitle: "//h2]",
    titleInput: "//label[text()='Title']/following-sibling::div[1]//input[contains(@class,'text')]",
    descriptionTextArea: "//label[text()='Description']/following-sibling::textarea",
    dependantList: "//ul[contains(@id,'PublishDialogDependantList')]",
    dependentItemToPublish: displayName => `//div[contains(@id,'StatusCheckableItem') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    selectionItemByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::span[contains(@class,'display-name') and text()='${text}']]`,
};

class CreateIssueDialog extends Page {

    constructor() {
        super();
        this.dependantsControls = new DependantsControls(xpath.container);
    }

    get container() {
        return xpath.container;
    }

    get closeButton() {
        return xpath.container + BUTTONS.buttonAriaLabel('Close');
    }

    get titleInput() {
        return xpath.container + xpath.titleInput;
    }

    get descriptionTextArea() {
        return xpath.container + xpath.descriptionTextArea;
    }

    get createIssueButton() {
        return xpath.container + BUTTONS.buttonByLabel('Create issue');
    }

    getDialogTitle() {
        return this.getText(xpath.container + xpath.dialogTitle);
    }

    get showExcludedItemsButton() {
        return xpath.container + lib.togglerButton('Show excluded');
    }

    get hideExcludedItemsButton() {
        return xpath.container + lib.togglerButton('Hide excluded');
    }

    async clickOnCreateIssueButton() {
        try {
            await this.waitForElementEnabled(this.createIssueButton, appConst.shortTimeout);
            await this.clickOnElement(this.createIssueButton);
            await this.pause(1000);
        } catch (err) {
            await this.handleError(`Error after clicking on 'Create Issue' button`, 'err_click_create_issue_btn', err);
        }
    }

    async clickOnCloseButton() {
        try {
            await this.clickOnElement(this.closeButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Create Issue dialog, Error after Clicking on Close button', 'err_close_issue_dialog', err);
        }
    }

    async clickOnIncludeChildrenToggler(contentName) {
        try {
            let selector = xpath.container + xpath.selectionItemByDisplayName(contentName) + lib.INCLUDE_CHILDREN_TOGGLER;
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            await this.clickOnElement(selector);
            await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_include_children');
            throw new Error(`Error when clicking on 'include children' icon , screenshot:${screenshot}` + err);
        }
    }

    // Insert text in Issue title input
    async typeTitle(issueName) {
        try {
            return await this.typeTextInInput(this.titleInput, issueName);
        } catch (err) {
            await this.handleError('Error when typing the issue name in the Title input field', 'err_type_issue_name', err);
        }
    }

    async waitForDialogLoaded() {
        try {
            await this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout);
            await this.pause(500);
        } catch (err) {
            await this.handleError('Create issue dialog should be loaded! ', 'err_create_issue_dialog_loaded', err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(xpath.container, appConst.mediumTimeout);
    }


    isTitleInputDisplayed() {
        return this.isElementDisplayed(this.titleInput);
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
            let principalComboBox = new PrincipalComboBox(this.container);
            await principalComboBox.selectFilteredUser(userName, this.container);
            await principalComboBox.clickOnApplySelectionButton(this.container);
        } catch (err) {
            await this.handleError(`Error when selecting user in Assignees combobox: ${userName}`, 'err_select_user_assignees', err);
        }
    }

    async typeContentNameInOptionsFilterInput(contentName) {
        try {
            let contentSelector = new ContentSelectorDropdown();
            await contentSelector.filterItem(contentName, this.container);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_issue_dropdown_filtered');
            throw new Error(`Error in Create issue Dialog, items selector, screenshot: ${screenshot} ` + err);
        }
    }

    async getCheckedOptionsDisplayNameInDropdownList(contentName) {
        try {
            let contentSelector = new ContentSelectorDropdown();
            return await contentSelector.getCheckedOptionsDisplayNameInDropdownList(xpath.container);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_issue_dropdown_filtered');
            throw new Error(`Error in Create issue Dialog, items selector, screenshot: ${screenshot} ` + err);
        }
    }

    async selectItemsInContentCombobox(displayName) {
        try {
            let issueItemsSelector = new IssueItemsSelector(this.container);
            await issueItemsSelector.clickOnFilteredByDisplayNameContent(displayName);
            await issueItemsSelector.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(`Create issue dialog, tried to select items in Items combobox: ${displayName}`,
                'err_select_items_combobox', err);
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
            throw new Error(`Create Issue dialog, Show Excluded button, screenshot:${screenshot}  ` + err);
        }
    }

    async waitForShowExcludedItemsButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.showExcludedItemsButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_excluded_btn');
            throw new Error(`Create Issue, 'Show excluded button' should be visible! screenshot: ${screenshot} ` + err)
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
            throw new Error(`'Hide excluded items' button should be hidden! screenshot: ${screenshot} ` + err)
        }
    }

    async getDisplayNameInDependentItems() {
        let locator = xpath.container + xpath.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER + lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(locator);
    }

    async isDependantCheckboxSelected(displayName) {
        return await this.dependantsControls.isDependantCheckboxSelected(displayName);
    }

    async waitForDependenciesListDisplayed() {
        let locator = xpath.container + xpath.dependantList + lib.DEPENDANTS.DEPENDANT_ITEM_VIEWER;
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
