/**
 * Created  on 3/1/2018.
 */
const page = require('../page');
const appConst = require('../../libs/app_const');
const elements = require('../../libs/elements');
const dialog = {
    container: `//div[contains(@id,'CreateIssueDialog')]`,
    createIssueButton: `//button[contains(@class,'dialog-button') and child::span[text()='Create Issue']]`,
    cancelButton: `//button[contains(@class,'button-bottom')]`,
    titleFormItem: "//div[contains(@id,'FormItem') and child::label[text()='Title']]",
    addItemsButton: "//button[contains(@id,'button') and child::span[text()='Add items']]",
    itemsComboBox: `//div[contains(@id,'LoaderComboBox') and @name='contentSelector']`,
    assigneesComboBox: `//div[contains(@id,'LoaderComboBox') and @name='principalSelector']`

};
var createIssueDialog = Object.create(page, {

    cancelTopButton: {
        get: function () {
            return `${dialog.container}` + `${elements.CANCEL_BUTTON_TOP}`;
        }
    },
    titleErrorMessage: {
        get: function () {
            return `${dialog.container}` + `${dialog.titleFormItem}` + `${elements.VALIDATION_RECORDING_VIEWER}`;
        }
    },
    titleInput: {
        get: function () {
            return `${dialog.container}` + `${dialog.titleFormItem}` + `${elements.TEXT_INPUT}`;
        }
    },
    titleInputValidationMessage: {
        get: function () {
            return `${dialog.container}` + `${dialog.titleFormItem}` + `${elements.VALIDATION_RECORDING_VIEWER}`;
        }
    },

    addItemsButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.addItemsButton}`;
        }
    },
    itemsOptionFilterInput: {
        get: function () {
            return `${dialog.container}` + `${dialog.itemsComboBox}` + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },
    assigneesOptionFilterInput: {
        get: function () {
            return `${dialog.container}` + `${dialog.assigneesComboBox}` + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },
    descriptionTextArea: {
        get: function () {
            return `${dialog.container}` + `${elements.TEXT_AREA}`;
        }
    },

    createIssueButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.createIssueButton}`;
        }
    },
    cancelBottomButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.cancelButton}`;
        }
    },
    clickOnCreateIssueButton: {
        value: function () {
            return this.doClick(this.createIssueButton).pause(500)
                .catch((err)=> {
                    this.saveScreenshot('err_click_create_issue');
                    throw new Error('create issue dialog ' + err);
                })
        }
    },
    clickOnAddItemsButton: {
        value: function () {
            return this.doClick(this.addItemsButton)
                .catch((err)=> {
                    this.saveScreenshot('err_click_add_items');
                    throw new Error('click on add items button' + err);
                })
        }
    },
    clickOnCancelBottomButton: {
        value: function () {
            return this.doClick(this.cancelBottomButton).then(()=> {
                return this.waitForNotVisible(`${dialog.container}`, appConst.TIMEOUT_3);
            }).catch((err)=> {
                this.saveScreenshot('err_close_issue_dialog');
                throw new Error('Create Issue dialog must be closed!')
            })
        }
    },
    waitForDialogLoaded: {
        value: function (ms) {
            return this.waitForVisible(`${dialog.container}`, ms);
        }
    },
    waitForDialogClosed: {
        value: function (ms) {
            return this.waitForVisible(`${dialog.container}`, ms);
        }
    },
    isWarningMessageDisplayed: {
        value: function () {
            return this.isVisible(this.warningMessage);
        }
    },
    isTitleInputDisplayed: {
        value: function () {
            return this.isVisible(this.titleInput);
        }
    },

    isCreateIssueButtonDisplayed: {
        value: function () {
            return this.isVisible(this.createIssueButton);
        }
    },
    isCancelButtonTopDisplayed: {
        value: function () {
            return this.isVisible(this.cancelTopButton);
        }
    },
    isCancelButtonBottomDisplayed: {
        value: function () {
            return this.isVisible(this.cancelBottomButton);
        }
    },
    isAddItemsButtonDisplayed: {
        value: function () {
            return this.isVisible(this.addItemsButton);
        }
    },

    isDescriptionTextAreaDisplayed: {
        value: function () {
            return this.isVisible(this.descriptionTextArea);
        }
    },
    clickOnCancelTopButton: {
        value: function () {
            return this.doClick(this.cancelTopButton);
        }
    },
    isItemsOptionFilterDisplayed: {
        value: function () {
            return this.isVisible(this.itemsOptionFilterInput);
        }
    },
    isAssigneesOptionFilterDisplayed: {
        value: function () {
            return this.isVisible(this.assigneesOptionFilterInput);
        }
    },
    getValidationMessageForTitleInput: {
        value: function () {
            return this.getText(this.titleInputValidationMessage);
        }
    },
    typeTitle: {
        value: function (issueName) {
            return this.typeTextInInput(this.titleInput, issueName).catch(err=> {
                this.saveScreenshot("err_type_issue_name");
                throw new Error('error when type issue-name ' + err);
            })
        }
    },
});
module.exports = createIssueDialog;
