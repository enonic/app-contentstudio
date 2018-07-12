const page = require('./page');
const appConst = require('../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'EditPermissionsDialog')]`,
    applyButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Apply')]]`,
    cancelButton: `//button/span[text()='Cancel']`,
    overwriteChildPermissionsCheckbox: `//div[contains(@class,'overwrite-child')]`,
    inheritPermissionsCheckbox: `//div[contains(@class,'inherit-perm')]`
};

const contentPublishDialog = Object.create(page, {

    cancelButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.cancelButton}`;
        }
    },
    applyButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.applyButton}`;
        }
    },
    overwriteChildPermissionsCheckbox: {
        get: function () {
            return `${xpath.container}` + `${xpath.overwriteChildPermissionsCheckbox}`;
        }
    },
    inheritPermissionsCheckbox: {
        get: function () {
            return `${xpath.container}` + `${xpath.inheritPermissionsCheckbox}`;
        }
    },
    waitForDialogLoaded: {
        value: function () {
            return this.waitForVisible(this.applyButton, appConst.TIMEOUT_2);
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, appConst.TIMEOUT_3).catch(err => {
                this.saveScreenshot('err_close_permissions_dialog');
                throw new Error('Edit Permissions dialog must be closed ' + err);
            })
        }
    },
    clickOnApplyButton: {
        value: function () {
            return this.doClick(this.applyButton).catch(err => {
                this.saveScreenshot('err_click_on_apply_button_permis_dialog');
                throw new Error('Error when clicking Apply dialog must be closed ' + err);
            })
        }
    },
    clickOnInheritPermissionsCheckBox: {
        value: function () {
            return this.doClick(this.inheritPermissionsCheckbox + '/label').catch(err => {
                this.saveScreenshot('err_click_on_inherit_permis_dialog');
                throw new Error('Error when clicking on Inherit permissions ' + err);
            })
        }
    },
    clickOnOverwiteChildPermissionsCheckBox: {
        value: function () {
            return this.doClick(this.overwriteChildPermissionsCheckbox + '/label').catch(err => {
                this.saveScreenshot('err_click_on_inherit_permis_dialog');
                throw new Error('Error when clicking on Inherit permissions ' + err);
            })
        }
    },
    isInheritPermissionsCheckBoxSelected: {
        value: function () {
            return this.isSelected(this.inheritPermissionsCheckbox + '//input').catch(err => {
                throw new Error('Error when checking Inherit permissions link ' + err);
            })
        }
    },
    isOverwriteChildPermissionsCheckBoxSelected: {
        value: function () {
            return this.isSelected(this.overwriteChildPermissionsCheckbox + '//input').catch(err => {
                throw new Error('Error when checking Overwrite child permissions link ' + err);
            })
        }
    },
});
module.exports = contentPublishDialog;

