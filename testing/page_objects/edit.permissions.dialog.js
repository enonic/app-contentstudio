const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const ComboBox = require('./components/loader.combobox');
const xpath = {
    container: `//div[contains(@id,'EditPermissionsDialog')]`,
    applyButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Apply')]]`,
    cancelButton: `//button/span[text()='Cancel']`,
    overwriteChildPermissionsCheckbox: `//div[contains(@class,'overwrite-child')]`,
    inheritPermissionsCheckbox: `//div[contains(@class,'inherit-perm')]`,
    permissionSelector: `//[contains(@id,'PermissionSelector')]`,
    aceSelectedOptions: "//div[contains(@id,'ACESelectedOptionsView')]",
    permissionToggleByOperationName: name => `//a[contains(@id,'PermissionToggle') and text()='${name}']`,
    aclEntryByName:
        name => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`,
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
        return this.waitForElementDisplayed(this.applyButton, appConst.mediumTimeout);
    }

    waitForDialogClosed() {
        let message = "Edit Permissions Dialog is not closed! timeout is " + 3000;
        return this.getBrowser().waitUntil(() => {
            return this.isElementNotDisplayed(xpath.container);
        }, appConst.mediumTimeout, message).then(() => {
            return this.pause(400);
        })
    }

    getDisplayNameOfSelectedPrincipals() {
        let selector = xpath.container + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selector);
    }

    getNameOfAccessControlEntries() {
        let selector = xpath.container + xpath.aceSelectedOptions + lib.P_SUB_NAME;
        return this.getTextInElements(selector);
    }

    removeAclEntry(principalName) {
        let selector = xpath.container + xpath.aclEntryByName(principalName) + lib.REMOVE_ICON;
        return this.clickOnElement(selector).catch(err => {
            this.saveScreenshot("err_remove_acl_entry");
            throw new Error("Error when trying to remove acl entry " + err);
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
    async showAceMenuAndSelectItem(principalName, menuItem) {
        try {
            let tabMenuButton = xpath.aclEntryByName(principalName) + `//div[contains(@class,'tab-menu-button')]`;
            let menuItemXpath = xpath.aclEntryByName(principalName) + xpath.menuItemByName(menuItem);
            //  Open menu:
            await this.clickOnElement(tabMenuButton);
            await this.pause(1000);
            //Select a menu item: Custom, Can Write, Can Read....
            return await this.clickOnElement(menuItemXpath);
        } catch (err) {
            this.saveScreenshot('err_click_on_ace_menu_button');
            throw new Error('Error when selecting an operation in Principal SelectedOptionView ' + err);
        }
    }

    //Permissions Toggle appears when a selected option switched to 'custom' mode
    //clicks on 'Read','Create', 'Modify' ....  permissions-toggles
    async clickOnPermissionToggle(principalName, operationName,) {
        try {
            let permToggle = xpath.permissionToggleByOperationName(operationName);
            let selector = xpath.aclEntryByName(principalName) + permToggle;
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            return await this.clickOnElement(selector);
        } catch (err) {
            this.saveScreenshot('err_click_on_permission_toggle');
            throw new Error('Error when clicking on Permission Toggle ' + err);
        }
    }

    async clickOnApplyButton() {
        try {
            await this.clickOnElement(this.applyButton);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot('err_click_on_apply_button_permis_dialog');
            throw new Error('Error when clicking Apply dialog must be closed ' + err);
        }
    }

    async isOperationAllowed(principalName, operation) {
        let permToggle = xpath.permissionToggleByOperationName(operation);
        let selector = xpath.aclEntryByName(principalName) + permToggle;
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        let result = await this.getAttribute(selector, 'class');
        return result.includes('allow');
    }

    async isOperationDenied(principalName, operation) {
        let permToggle = xpath.permissionToggleByOperationName(operation);
        let selector = xpath.aclEntryByName(principalName) + permToggle;
        await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        let result = await this.getAttribute(selector, 'class');
        return result.includes('deny');
    }

    async clickOnInheritPermissionsCheckBox() {
        try {
            await this.waitForElementDisplayed(this.inheritPermissionsCheckbox, appConst.mediumTimeout);
            await this.pause(300);
            await this.clickOnElement(this.inheritPermissionsCheckbox + '/label');
            return await this.pause(300);
        } catch (err) {
            this.saveScreenshot('err_click_on_inherit_permis_dialog');
            throw new Error('Error when clicking on Inherit permissions ' + err);
        }
    }

    clickOnOverwriteChildPermissionsCheckBox() {
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

