/**
 * Created on 23.07.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const loaderComboBox = require('../components/loader.combobox');
const siteConfigDialog = require('./site.configurator.dialog');
const xpath = {
    container: `//div[contains(@id,'SecurityWizardStepForm')]`,
    permissionSelector: `//div[contains(@id,'PermissionSelector')]`,
    editPermissionsButton: `//button[contains(@class,'edit-permissions') and child::span[text()='Edit Permissions']]`,
    entryRowByDisplayName:
        displayName => `//div[contains(@id,'AccessControlEntryView') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,

}
var accessStepForm = Object.create(page, {

    editPermissionsButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.editPermissionsButton}`;
        }
    },
    clickOnEditPermissionsButton: {
        value: function (displayName) {
            return this.doClick(this.editPermissionsButton).pause(500).catch(err => {
                this.saveScreenshot("err_click_on_edit_permissions_button");
                throw new Error('Error when clicking on `Edit Permissions` button! ' + err);
            });
        }
    },
    clickOnEntryRow: {
        value: function (displayName) {
            let entryRow = xpath.entryRowByDisplayName(displayName);
            return this.doClick(entryRow).pause(500).catch(err => {
                this.saveScreenshot("err_click_on_entry_row_wizard");
                throw new Error('Error when clicking on entry row in wizard! ' + err);
            });
        }
    },
    getPermissionOperations: {
        value: function (principalDisplayName) {
            let selector = xpath.entryRowByDisplayName(principalDisplayName) + xpath.permissionSelector +
                           `//a[contains(@id,'PermissionToggle')]`;
            return this.waitForVisible(selector, appConst.TIMEOUT_2).then(() => {
                return this.getText(selector);
            }).then(result => {
                return [].concat(result).filter(value => value.length > 0);
            });
        }
    }
});
module.exports = accessStepForm;


