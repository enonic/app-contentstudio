const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const AccessControlComboBox = require('./components/selectors/access.control.combobox');
const xpath = {
    container: `//div[contains(@id,'EditPermissionsDialog')]`,
    accessSelector: "//div[contains(@id,'AccessSelector')]",
    contentPath: "//p[@class='path']",
    applyButton: `//button[contains(@id,'DialogButton') and child::span[contains(.,'Apply')]]`,
    cancelButton: `//button/span[text()='Cancel']`,
    overwriteChildPermissionsCheckbox: `//div[contains(@class,'overwrite-child')]`,
    inheritPermissionsCheckbox: `//div[contains(@class,'inherit-perm')]`,
    permissionSelector: `//[contains(@id,'PermissionSelector')]`,
    aceSelectedOptions: "//div[contains(@id,'ACESelectedOptionsView')]",
    permissionToggleByOperationName: name => `//a[contains(@id,'PermissionToggle') and text()='${name}']`,
    aclEntryByName:
        name => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`,
    aclEntryByDisplayName:
        displayName => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::h6[contains(@class,'main-name') and contains(.,'${displayName}')]]`,
    menuItemByName:
        name => `//li[contains(@id,'TabMenuItem') and child::a[text()='${name}']]`,
};

class EditPermissionsDialog extends Page {

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

    get contentPath() {
        return xpath.container + xpath.contentPath;
    }

    async waitForDialogLoaded() {
        await this.waitForElementDisplayed(this.applyButton, appConst.mediumTimeout);
        return await this.pause(300);
    }

    waitForDialogClosed() {
        let message = "Edit Permissions Dialog is not closed! timeout is " + 3000;
        return this.getBrowser().waitUntil(() => {
            return this.isElementNotDisplayed(xpath.container);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: message}).then(() => {
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
            throw new Error("Error when remove acl entry " + err);
        });
    }

    // filters and select a principal
    async filterAndSelectPrincipal(principalDisplayName) {
        try {
            let accessControlComboBox = new AccessControlComboBox();
            await accessControlComboBox.selectFilteredPrincipalAndClickOnOk(principalDisplayName, xpath.container);
            console.log("Edit Permissions Dialog, principal is selected: " + principalDisplayName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_perm_dlg');
            throw new Error("Error during updating permissions, screenshot:" + screenshot + "  " + err);
        }
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
            await this.waitForApplyButtonEnabled();
            await this.clickOnElement(this.applyButton);
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot('err_click_on_apply_button_permis_dialog');
            throw new Error('Error when clicking Apply dialog must be closed ' + err);
        }
    }

    waitForApplyButtonEnabled() {
        return this.waitForElementEnabled(this.cancelButton, appConst.mediumTimeout);
    }

    waitForApplyButtonDisabled() {
        return this.waitForElementDisabled(this.applyButton, appConst.mediumTimeout);
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
            await this.clickOnElement(this.inheritPermissionsCheckbox + '/label');
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot('err_click_on_inherit_permis_dialog');
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

    async waitForAccessSelectorDisabled(principalName) {
        let locator = xpath.aclEntryByDisplayName(principalName) + xpath.accessSelector;
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, "class");
            return result.includes("disabled");
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Access selector should be disabled "});
    }

    async waitForAccessSelectorEnabled(principalDisplayName) {
        let locator = xpath.aclEntryByDisplayName(principalDisplayName) + xpath.accessSelector;
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, "class");
            return !result.includes("disabled");
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Access selector should be enabled "});
    }

    getContentPath() {
        return this.getText(this.contentPath);
    }

    async clickOnCancelButton() {
        await this.waitForElementDisplayed(this.cancelButton, appConst.mediumTimeout);
        return await this.clickOnElement(this.cancelButton);
    }
}

module.exports = EditPermissionsDialog;

