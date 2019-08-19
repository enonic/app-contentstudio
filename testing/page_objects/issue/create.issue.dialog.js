/**
 * Created  on 3/1/2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const XPATH = {
    container: `//div[contains(@id,'CreateIssueDialog')]`,
    createIssueButton: `//button[contains(@class,'dialog-button') and child::span[contains(.,'Create Issue')]]`,
    cancelButton: `//button[contains(@class,'button-bottom')]`,
    titleFormItem: "//div[contains(@id,'FormItem') and child::label[text()='Title']]",
    addItemsButton: "//button[contains(@id,'button') and child::span[text()='Add items']]",
    itemsComboBox: `//div[contains(@id,'LoaderComboBox') and @name='contentSelector']`,
    assigneesComboBox: `//div[contains(@id,'LoaderComboBox') and @name='principalSelector']`,
    selectionItemByDisplayName:
        text => `//div[contains(@id,'TogglableStatusSelectionItem') and descendant::h6[contains(@class,'main-name') and text()='${text}']]`,
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

    async clickOnCreateIssueButton() {
        try {
            await this.waitForElementEnabled(this.createIssueButton, appConst.TIMEOUT_2);
            await this.clickOnElement(this.createIssueButton);
            await this.pause(400);
        } catch (err) {
            this.saveScreenshot('err_click_create_issue_button');
            throw new Error('create issue dialog: ' + err);
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
            return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_3);
        }).catch(err => {
            this.saveScreenshot('err_close_issue_dialog');
            throw new Error('Create Issue dialog must be closed!')
        })
    }

    async clickOnIncludeChildrenToggler(displayName) {
        let selector = XPATH.container + XPATH.selectionItemByDisplayName(displayName) + lib.INCLUDE_CHILDREN_TOGGLER;
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
        return await this.clickOnElement(selector).catch(err => {
            this.saveScreenshot('err_click_on_include_children');
            throw new Error('Error when clicking on `include children` icon ' + displayName + ' ' + err);
        });
    }

    getValidationMessageForTitleInput() {
        return this.getText(this.titleInputValidationMessage);
    }

    typeTitle(issueName) {
        return this.typeTextInInput(this.titleInput, issueName).catch(err => {
            this.saveScreenshot("err_type_issue_name");
            throw new Error('error when type issue-name ' + err);
        })
    }

    clickOnCancelTopButton() {
        return this.clickOnElement(this.cancelTopButton);
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(XPATH.container, appConst.TIMEOUT_2);
    }

    waitForDialogClosed() {
        return this.waitForElementDisplayed(XPATH.container, appConst.TIMEOUT_2);
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
};
module.exports = CreateIssueDialog;