/**
 * Created  on 3/1/2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const LoaderComboBox = require('../components/loader.combobox');

const XPATH = {
    container: `//div[contains(@id,'CreateIssueDialog')]`,
    dialogTitle: "//div[contains(@id,'DefaultModalDialogHeader') and child::h2[@class='title']]",
    createIssueButton: `//button[contains(@class,'dialog-button') and child::span[contains(.,'Create Issue')]]`,
    cancelButton: `//button[contains(@class,'button-bottom')]`,
    titleFormItem: "//div[contains(@id,'FormItem') and child::label[text()='Title']]",
    addItemsButton: "//button[contains(@id,'button') and child::span[text()='Add items']]",
    itemsComboBox: `//div[contains(@id,'LoaderComboBox') and @name='contentSelector']`,
    assigneesComboBox: `//div[contains(@id,'LoaderComboBox') and @name='principalSelector']`,
    selectionItemByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::span[contains(@class,'display-name') and text()='${text}']]`,
};

class CreateIssueDialog extends Page {

    get cancelTopButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get cancelBottomButton() {
        return XPATH.container + XPATH.cancelButton;
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

    get itemsOptionFilterInput() {
        return XPATH.container + XPATH.itemsComboBox + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get assigneesOptionFilterInput() {
        return XPATH.container + XPATH.assigneesComboBox + lib.COMBO_BOX_OPTION_FILTER_INPUT;
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

    async clickOnCreateIssueButton() {
        try {
            await this.waitForElementEnabled(this.createIssueButton, appConst.shortTimeout);
            await this.clickOnElement(this.createIssueButton);
            await this.pause(500);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_create_issue_btn')
            await this.saveScreenshot(screenshot);
            throw new Error('create issue dialog: ' + screenshot + ' ' + err);
        }
    }

    clickOnAddItemsButton() {
        return this.clickOnElement(this.addItemsButton).catch(err => {
            this.saveScreenshot('err_click_add_items');
            throw new Error('click on add items button' + err);
        });
    }

    clickOnCancelBottomButton() {
        return this.clickOnElement(this.cancelBottomButton).then(() => {
            return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout);
        }).catch(err => {
            this.saveScreenshot('err_close_issue_dialog');
            throw new Error('Create Issue dialog must be closed! ' + err);
        })
    }

    async clickOnIncludeChildrenToggler(contentName) {
        try {
            let selector = XPATH.container + XPATH.selectionItemByDisplayName(contentName) + lib.INCLUDE_CHILDREN_TOGGLER;
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            return await this.clickOnElement(selector);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_include_children'));
            throw new Error("Error when clicking on 'include children' icon " + err);
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

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
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
        return this.isElementDisplayed(this.cancelBottomButton);
    }

    isAddItemsButtonDisplayed() {
        return this.isElementDisplayed(this.addItemsButton);
    }

    isDescriptionTextAreaDisplayed() {
        return this.isElementDisplayed(this.descriptionTextArea);
    }

    isItemsOptionFilterDisplayed() {
        return this.isElementDisplayed(this.itemsOptionFilterInput);
    }

    isAssigneesOptionFilterDisplayed() {
        return this.isElementDisplayed(this.assigneesOptionFilterInput);
    }

    async selectUserInAssignees(userName) {
        try {
            let loaderComboBox = new LoaderComboBox();
            return await loaderComboBox.typeTextAndSelectOption(userName, XPATH.container);
        } catch (err) {
            throw new Error("Create issue Dialog  " + err);
        }
    }
}

module.exports = CreateIssueDialog;
