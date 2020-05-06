/**
 * Created on 23.07.2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'SecurityWizardStepForm')]`,
    accessControlList: "//ul[contains(@id,'AccessControlListView')]",
    permissionSelector: `//div[contains(@id,'PermissionSelector')]`,
    editPermissionsButton: `//button[contains(@class,'edit-permissions') and child::span[text()='Edit Permissions']]`,
    entryRowByDisplayName:
        displayName => `//div[contains(@id,'AccessControlEntryView') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    toggleByOperationName: operation => `//a[contains(@id,'PermissionToggle') and text()='${operation}']`,
};

class AccessStepForm extends Page {

    get editPermissionsButton() {
        return XPATH.container + XPATH.editPermissionsButton;
    }

    //returns list of display name of ACL-entries in the access step form:
    getAclEntriesDisplayName() {
        let selector = XPATH.container + XPATH.accessControlList + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selector);
    }

    clickOnEditPermissionsButton(displayName) {
        return this.clickOnElement(this.editPermissionsButton).catch(err => {
            this.saveScreenshot("err_click_on_edit_permissions_button");
            throw new Error('Error when clicking on `Edit Permissions` button! ' + err);
        });
    }

    clickOnEntryRow(displayName) {
        let entryRow = XPATH.entryRowByDisplayName(displayName);
        return this.clickOnElement(entryRow).catch(err => {
            this.saveScreenshot("err_click_on_entry_row_wizard");
            throw new Error('Error when clicking on entry row in wizard! ' + err);
        }).then(() => {
            this.pause(500);
        })
    }

    getPermissionOperations(principalDisplayName) {
        let selector = XPATH.entryRowByDisplayName(principalDisplayName) + XPATH.permissionSelector +
                       `//a[contains(@id,'PermissionToggle')]`;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_2).then(() => {
            return this.getTextInElements(selector);
        }).then(result => {
            return [].concat(result).filter(value => value.length > 0);
        });
    }

    isOperationAllowed(principalDisplayName, operation) {
        let selector = XPATH.entryRowByDisplayName(principalDisplayName) + XPATH.permissionSelector +
                       XPATH.toggleByOperationName(operation);
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_2).then(() => {
            return this.getAttribute(selector, 'class');
        }).then(result => {
            return result.includes('allow');
        });
    }

    isOperationDenied(principalDisplayName, operation) {
        let selector = XPATH.entryRowByDisplayName(principalDisplayName) + XPATH.permissionSelector +
                       XPATH.toggleByOperationName(operation);
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_2).then(() => {
            return this.getAttribute(selector, 'class');
        }).then(result => {
            return result.includes('deny');
        });
    }
};
module.exports = AccessStepForm;


