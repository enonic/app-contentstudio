const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const utils = require('../libs/studio.utils');
const ComboBox = require('./components/loader.combobox');
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

class EditPermissionsDialog extends Page {

    get principalsOptionFilterInput() {
        return xpath.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get cancelButton() {
        return xpath.container + xpath.cancelButton;
    }

    get applyButton() {
        return xpath.container + xpath.applyButton;
    }

    get overwriteChildPermissionsCheckbox() {
        return xpath.container + xpath.overwriteChildPermissionsCheckbox;
    }

    get inheritPermissionsCheckbox() {
        return xpath.container + xpath.inheritPermissionsCheckbox;
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(this.applyButton, appConst.TIMEOUT_3);
    }

    waitForDialogClosed() {
        let message = "Edit Permissions Dialog is not closed! timeout is " + 3000;
        return this.getBrowser().waitUntil(() => {
            return this.isElementNotDisplayed(xpath.container);
        }, appConst.TIMEOUT_3, message).then(() => {
            return this.pause(400);
        })
    }

    getDisplayNameOfSelectedPrincipals() {
        let selector = xpath.container + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selector);
    }

    removeAclEntry(principalName) {
        let selector = xpath.container + xpath.aclEntryByName(principalName) + lib.REMOVE_ICON;
        return this.clickOnElement(selector).catch(err => {
            this.saveScreenshot("err_remove_acl_entry");
            throw new Error("Error when try to remove acl entry " + err);
        });
    }

    //filters and select a principal
    filterAndSelectPrincipal(principalDisplayName) {
        let comboBox = new ComboBox();
        return comboBox.typeTextAndSelectOption(principalDisplayName, xpath.container).then(() => {
            console.log("Edit Permissions Dialog, principal is selected: " + principalDisplayName);
        })
    }

    //finds an entry, clicks on 'tab-menu-button' (Can Write or Can Read or Custom...)  and selects new required 'operation'
    showAceMenuAndSelectItem(principalName, menuItem) {
        let tabMenuButton = xpath.aclEntryByName(principalName) + `//div[contains(@class,'tab-menu-button')]`;
        let menuItemXpath = xpath.aclEntryByName(principalName) + xpath.menuItemByName(menuItem);
        return this.clickOnElement(tabMenuButton).then(() => {
            return this.pause(1000);
        }).then(() => {
            return this.clickOnElement(menuItemXpath);
        }).catch(err => {
            this.saveScreenshot('err_click_on_ace_menu_button');
            throw new Error('Error when clicking on ACE-menu button ' + err);
        })
    }


    //Permissions Toggle appears when a selected option switched to 'custom' mode
    //clicks on 'Read','Create', 'Modify' ....  permissions-toggles
    clickOnPermissionToggle(principalName, operationName,) {
        let permToggle = xpath.permissionToggleByOperationName(operationName);
        let selector = xpath.aclEntryByName(principalName) + permToggle;
        return this.waitForElementDisplayed(selector, 1000).then(() => {
            return this.clickOnElement(selector);
        }).catch(err => {
            this.saveScreenshot('err_click_on_permission_toggle');
            throw new Error('Error when clicking on Permission Toggle ' + err);
        })
    }

    clickOnApplyButton() {
        return this.clickOnElement(this.applyButton).then(() => {
            return this.pause(500);
        }).catch(err => {
            this.saveScreenshot('err_click_on_apply_button_permis_dialog');
            throw new Error('Error when clicking Apply dialog must be closed ' + err);
        })
    }

    isOperationAllowed(principalName, operation) {
        let permToggle = xpath.permissionToggleByOperationName(operation);
        let selector = xpath.aclEntryByName(principalName) + permToggle;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_2).then(() => {
            return this.getAttribute(selector, 'class');
        }).then(result => {
            return result.includes('allow');
        });
    }


    isOperationDenied(principalName, operation) {
        let permToggle = xpath.permissionToggleByOperationName(operation);
        let selector = xpath.aclEntryByName(principalName) + permToggle;
        return this.waitForElementDisplayed(selector, appConst.TIMEOUT_2).then(() => {
            return this.getAttribute(selector, 'class');
        }).then(result => {
            return result.includes('deny');
        });
    }

    clickOnInheritPermissionsCheckBox() {
        return this.waitForElementDisplayed(this.inheritPermissionsCheckbox).then(() => {
            return this.clickOnElement(this.inheritPermissionsCheckbox + '/label');
        }).then(() => {
            return this.pause(500);
        }).catch(err => {
            this.saveScreenshot('err_click_on_inherit_permis_dialog');
            throw new Error('Error when clicking on Inherit permissions ' + err);
        });
    }

    clickOnOverwiteChildPermissionsCheckBox() {
        return this.clickOnElement(this.overwriteChildPermissionsCheckbox + '/label').catch(err => {
            this.saveScreenshot('err_click_on_inherit_permis_dialog');
            throw new Error('Error when clicking on Inherit permissions ' + err);
        })
    }

    isInheritPermissionsCheckBoxSelected() {
        return this.isSelected(this.inheritPermissionsCheckbox + '//input').catch(err => {
            throw new Error('Error when checking Inherit permissions link ' + err);
        })
    }

    isOverwriteChildPermissionsCheckBoxSelected() {
        return this.isSelected(this.overwriteChildPermissionsCheckbox + '//input').catch(err => {
            throw new Error('Error when checking Overwrite child permissions link ' + err);
        })
    }
};
module.exports = EditPermissionsDialog;

