const page = require('./page');
const appConst = require('../libs/app_const');
const elements = require('../libs/elements');
const xpath = {
    container: `//div[contains(@id,'ContentDuplicateDialog')]`,
    duplicateButton: `//button/span[contains(.,'Duplicate')]`,
    cancelButton: `//button/span[text()='Cancel']`,
    includeChildToggler: `//div[contains(@id,'IncludeChildrenToggler')]`,
    showDependentItemsLink: `//h6[@class='dependants-header' and contains(.,'Show dependent items')]`,
    hideDependentItemsLink: `//h6[@class='dependants-header' and contains(.,'Hide dependent items')]`,
};

const contentDuplicateDialog = Object.create(page, {

    cancelButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.cancelButton}`;

        }
    },
    showDependentItemsLink: {
        get: function () {
            return `${xpath.container}` + `${xpath.showDependentItemsLink}`;

        }
    },
    hideDependentItemsLink: {
        get: function () {
            return `${xpath.container}` + `${xpath.hideDependentItemsLink}`;

        }
    },
    duplicateButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.duplicateButton}`;
        }
    },
    includeChildToggler: {
        get: function () {
            return `${xpath.container}` + `${xpath.includeChildToggler}`;
        }
    },
    isIncludeChildTogglerDisplayed: {
        value: function () {
            return this.isVisible(this.includeChildToggler).catch(err => {
                this.saveScreenshot('err_duplicate_dialog_toggler');
                console.log('Content Duplicate dialog, include child was not found ' + err);
                return false;
            })
        }
    },
    isShowDependentItemsLinkDisplayed: {
        value: function () {
            return this.waitForVisible(this.showDependentItemsLink, appConst.TIMEOUT_2).catch(err => {
                console.log(err);
                return false;
            })
        }
    },
    waitForHideDependentItemLinkDisplayed: {
        value: function () {
            return this.waitForVisible(this.hideDependentItemsLink, appConst.TIMEOUT_2).catch((err) => {
                this.saveScreenshot('err_load_hide_dependent_link');
                throw new Error('Hide Dependent link must be loaded ' + err);
            })
        }
    },
    isDuplicateButtonDisplayed: {
        value: function () {
            return this.waitForVisible(this.duplicateButton, appConst.TIMEOUT_2).catch(err => {
                console.log(err);
                return false;
            })
        }
    },
    isCancelButtonDisplayed: {
        value: function () {
            return this.waitForVisible(this.cancelButton, appConst.TIMEOUT_2).catch(err => {
                console.log(err);
                return false;
            })
        }
    },
    clickOnIncludeChildToggler: {
        value: function () {
            return this.doClick(this.includeChildToggler).pause(1000);
        }
    },
    clickOnDuplicateButton: {
        value: function () {
            return this.doClick(this.duplicateButton).pause(500);
        }
    },
    clickOnShowDependentItemLink: {
        value: function () {
            return this.doClick(this.showDependentItemsLink);
        }
    },
    waitForDialogVisible: {
        value: function () {
            return this.waitForVisible(this.duplicateButton, appConst.TIMEOUT_2).catch((err) => {
                this.saveScreenshot('err_open_duplicate_dialog');
                throw new Error('Content Duplicate dialog must be loaded ' + err);
            })
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, appConst.TIMEOUT_10).catch(err => {
                this.saveScreenshot('err_close_duplicate_dialog');
                throw new Error('Content Duplicate dialog must be closed ' + err);
            })
        }
    },
    getNumberInDependentItemsLink: {
        value: function () {
            return this.getText(this.showDependentItemsLink).then(result => {
                let startIndex = result.indexOf('(');
                let endIndex = result.indexOf(')');
                return result.substring(startIndex + 1, endIndex);
            }).catch(err => {
                throw new Error('Duplicate Dialog :error when getting number in the link : ' + err)
            })
        }
    },
    getTotalNumberItemsToDuplicate: {
        value: function () {
            return this.getText(this.duplicateButton).then(result => {
                let startIndex = result.indexOf('(');
                let endIndex = result.indexOf(')');
                return result.substring(startIndex + 1, endIndex);
            }).catch(err => {
                throw new Error('Duplicate Dialog: error when getting number in the button : ' + err)
            })
        }
    },

    getDisplayNamesToDuplicate: {
        value: function () {
            let selector = xpath.container + `//ul[contains(@id,'DialogTogglableItemList')]` + elements.H6_DISPLAY_NAME;
            return this.getText(selector).then(result => {
                console.info(result);
                return result;
            }).catch(err => {
                throw new Error('Duplicate Dialog: error when getting display names : ' + err)
            })
        }
    },
    getDependentsName: {
        value: function () {
            let selector = xpath.container + `//ul[contains(@id,'DialogDependantList')]` + elements.H6_DISPLAY_NAME;
            return this.getText(selector).then(result => {
                console.info(result);
                return result;
            }).catch(err => {
                throw new Error('Duplicate Dialog: error when getting dependents name : ' + err)
            })
        }
    },
});
module.exports = contentDuplicateDialog;

