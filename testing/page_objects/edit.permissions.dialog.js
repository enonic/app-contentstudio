const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');
const AccessControlComboBox = require('./components/selectors/access.control.combobox');

const xpath = {
    container: `//div[contains(@id,'EditPermissionsDialog')]`,
    accessSelector: "//div[contains(@id,'AccessSelector')]",
    contentPath: "//p[@class='path']",
    accessModeDiv: `//div[contains(@class,'access-mode-container')]`,
    permissionSelector: `//[contains(@id,'PermissionSelector')]`,
    aceSelectedOptionsView: "//div[contains(@id,'ACESelectedOptionsView')]",
    dialogButtonRow: `//div[contains(@class,'button-container')]`,
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
        return xpath.container + xpath.dialogButtonRow + lib.dialogButton('Apply');
    }

    get nextButton() {
        return xpath.container + xpath.dialogButtonRow + lib.dialogButton('Next');
    }

    get resetButton() {
        return xpath.container + xpath.accessModeDiv + lib.dialogButton('Reset');
    }

    get backButton() {
        return xpath.container + xpath.dialogButtonRow + lib.dialogButton('Back');
    }

    get publicRadioButton() {
        return xpath.container + lib.radioButtonByLabel('Public');
    }

    get restrictedRadioButton() {
        return xpath.container + lib.radioButtonByLabel('Restricted');
    }

    get contentPath() {
        return xpath.container + xpath.contentPath;
    }

    async waitForNextButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_next_button');
            throw new Error(`Next button should be disabled ${screenshot}` + err);
        }
    }

    async waitForResetButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.resetButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_reset_button');
            throw new Error(`Reset button should be disabled ${screenshot}` + err);
        }
    }

    async waitForResetButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.resetButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_reset_button');
            throw new Error(`Reset button should be enabled ${screenshot}` + err);
        }
    }

    async waitForDialogLoaded() {
        try {
            await this.waitForElementDisplayed(xpath.dialogButtonRow, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_edit_perm_dlg_not_loaded');
            throw new Error("Edit permissions dialog was not loaded!  " + err);
        }
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
        let selector = xpath.container + xpath.aceSelectedOptionsView + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selector);
    }

    getNameOfAccessControlEntries() {
        let selector = xpath.container + xpath.aceSelectedOptionsView + lib.P_SUB_NAME;
        return this.getTextInElements(selector);
    }

    async removeAclEntry(principalName) {
        try {
            let selector = xpath.container + xpath.aclEntryByName(principalName) + lib.REMOVE_ICON;
            return await this.clickOnElement(selector)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_remove_acl_entry');
            throw new Error(`Error when remove acl entry, screenshot: ${screenshot} ` + err);
        }
    }

    // filters and select a principal
    async filterAndSelectPrincipal(principalDisplayName) {
        try {
            let accessControlComboBox = new AccessControlComboBox();
            await accessControlComboBox.selectFilteredPrincipalAndClickOnApply(principalDisplayName, xpath.container);
            console.log("Edit Permissions Dialog, principal is selected: " + principalDisplayName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_perm_dlg');
            throw new Error(`Error during updating permissions, screenshot:${screenshot}` + err);
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
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_ace_menu_button');
            throw new Error(`Error when selecting an operation in Principal SelectedOptionView , ${screenshot}` + err);
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
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_permission_toggle');
            throw new Error(`Error when clicking on Permission Toggle , ${screenshot}` + err);
        }
    }

    async clickOnApplyButton() {
        try {
            await this.waitForApplyButtonEnabled();
            await this.clickOnElement(this.applyButton);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_apply_button_permis_dialog');
            throw new Error(`Error when clicking Apply dialog must be closed screenshot:${screenshot}` + err);
        }
    }

    waitForApplyButtonEnabled() {
        return this.waitForElementEnabled(this.applyButton, appConst.mediumTimeout);
    }

    async waitForApplyButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.applyButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_button');
            throw new Error(`Apply button should be enabled, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForNextButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_next_button_disabled');
            throw new Error(`Edit Permissions dialog, Next button should be disabled screenshot:${screenshot}` + err);
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
            await this.clickOnElement(this.inheritPermissionsCheckbox + '/label');
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot('err_click_on_inherit_permis_dialog');
            throw new Error('Error when clicking on Inherit permissions ' + err);
        }
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

