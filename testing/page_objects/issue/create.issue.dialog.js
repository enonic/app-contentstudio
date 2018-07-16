/**
 * Created  on 3/1/2018.
 */
const page = require('../page');
const appConst = require('../../libs/app_const');
const elements = require('../../libs/elements');
const xpath = {
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
var createIssueDialog = Object.create(page, {

    cancelTopButton: {
        get: function () {
            return `${xpath.container}` + `${elements.CANCEL_BUTTON_TOP}`;
        }
    },
    titleErrorMessage: {
        get: function () {
            return `${xpath.container}` + `${xpath.titleFormItem}` + `${elements.VALIDATION_RECORDING_VIEWER}`;
        }
    },
    titleInput: {
        get: function () {
            return `${xpath.container}` + `${xpath.titleFormItem}` + `${elements.TEXT_INPUT}`;
        }
    },
    titleInputValidationMessage: {
        get: function () {
            return `${xpath.container}` + `${xpath.titleFormItem}` + `${elements.VALIDATION_RECORDING_VIEWER}`;
        }
    },

    addItemsButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.addItemsButton}`;
        }
    },
    itemsOptionFilterInput: {
        get: function () {
            return `${xpath.container}` + `${xpath.itemsComboBox}` + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },
    assigneesOptionFilterInput: {
        get: function () {
            return `${xpath.container}` + `${xpath.assigneesComboBox}` + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },
    descriptionTextArea: {
        get: function () {
            return `${xpath.container}` + `${elements.TEXT_AREA}`;
        }
    },

    createIssueButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.createIssueButton}`;
        }
    },
    cancelBottomButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.cancelButton}`;
        }
    },
    clickOnCreateIssueButton: {
        value: function () {
            return this.doClick(this.createIssueButton).pause(500)
                .catch((err) => {
                    this.saveScreenshot('err_click_create_issue');
                    throw new Error('create issue dialog ' + err);
                })
        }
    },
    clickOnAddItemsButton: {
        value: function () {
            return this.doClick(this.addItemsButton)
                .catch(err => {
                    this.saveScreenshot('err_click_add_items');
                    throw new Error('click on add items button' + err);
                })
        }
    },
    clickOnCancelBottomButton: {
        value: function () {
            return this.doClick(this.cancelBottomButton).then(() => {
                return this.waitForNotVisible(`${dialog.container}`, appConst.TIMEOUT_3);
            }).catch(err => {
                this.saveScreenshot('err_close_issue_dialog');
                throw new Error('Create Issue dialog must be closed!')
            })
        }
    },
    clickOnIncludeChildrenToggler: {
        value: function (displayName) {
            let selector = xpath.container + xpath.selectionItemByDisplayName(displayName) + `${elements.INCLUDE_CHILDREN_TOGGLER}`;
            return this.waitForVisible(selector, appConst.TIMEOUT_2).then(() => {
                return this.doClick(selector);
            }).catch(err => {
                this.saveScreenshot('err_click_on_include_children');
                throw new Error('Error when clicking on `include children` icon ' + displayName + ' ' + err);
            })
        }
    },
    waitForDialogLoaded: {
        value: function () {
            return this.waitForVisible(`${xpath.container}`, appConst.TIMEOUT_2);
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForVisible(`${xpath.container}`, appConst.TIMEOUT_2);
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
            return this.typeTextInInput(this.titleInput, issueName).catch(err => {
                this.saveScreenshot("err_type_issue_name");
                throw new Error('error when type issue-name ' + err);
            })
        }
    },
});
module.exports = createIssueDialog;
