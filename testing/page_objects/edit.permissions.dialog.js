const page = require('./page');
const appConst = require('../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'EditPermissionsDialog')]`,
    applyButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Apply')]]`,
    cancelButton: `//button/span[text()='Cancel']`,
    overwriteChildPermissionsCheckbox: `//div[contains(@class,'overwrite-child')]`,
    inheritPermissionsCheckbox: `//div[contains(@class,'inherit-perm')]`,
    permissionSelector: `//[contains(@id,'PermissionSelector')]`,
    permissionToggleByOperationName: name => `//a[contains(@id,'PermissionToggle') and text()='${name}']`,
    aclEntryByName:
        name => `//div[contains(@id,'ACESelectedOptionView') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`,
    menuItemByName:
        name => `//li[contains(@id,'TabMenuItem') and child::a[text()='${name}']]`,
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

    showAceMenuAndSelectItem: {
        value: function (principalName, menuItem) {
            let tabMenuButton = xpath.aclEntryByName(principalName) + `//div[contains(@class,'tab-menu-button')]`;
            let menuItemXpath = xpath.aclEntryByName(principalName) + xpath.menuItemByName(menuItem);
            return this.doClick(tabMenuButton).pause(1000).then(() => {
                return this.doClick(menuItemXpath)
            }).catch(err => {
                this.saveScreenshot('err_click_on_ace_menu_button');
                throw new Error('Error when clicking on ACE-menu button ' + err);
            })
        }
    },
    clickOnPermissionToggle: {
        value: function (principalName, operationName,) {
            let permToggle = xpath.permissionToggleByOperationName(operationName);
            let selector = xpath.aclEntryByName(principalName) + permToggle;

            return this.waitForVisible(selector, 1000).then(() => {
                return this.doClick(selector);
            }).catch(err => {
                this.saveScreenshot('err_click_on_permission_toggle');
                throw new Error('Error when clicking on Permission Toggle ' + err);
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
    isOperationAllowed: {
        value: function (principalName, operation) {
            let permToggle = xpath.permissionToggleByOperationName(operation);
            let selector = xpath.aclEntryByName(principalName)+permToggle;

            return this.waitForVisible(selector, appConst.TIMEOUT_2).then(() => {
                return this.getAttribute(selector, 'class');
            }).then(result => {
                return result.includes('allow');
            });
        }
    },
    isOperationDenied: {
        value: function (principalName, operation) {
            let permToggle = xpath.permissionToggleByOperationName(operation);
            let selector = xpath.aclEntryByName(principalName)+permToggle;
            return this.waitForVisible(selector, appConst.TIMEOUT_2).then(() => {
                return this.getAttribute(selector, 'class');
            }).then(result => {
                return result.includes('deny');
            });
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

