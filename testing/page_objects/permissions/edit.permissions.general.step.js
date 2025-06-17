const BaseStepPermissionsDialog = require('./base.step.edit.permissions.dialog');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const AccessControlComboBox = require('../components/selectors/access.control.combobox');

const xpath = {
    stepDescriptionP: "//p[contains(@class,'sub-name') and text()='1 of 3 - General access']",
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

class EditPermissionsGeneralStep extends BaseStepPermissionsDialog {

    get stepDescription() {
        return this.container + xpath.stepDescriptionP;
    }

    get cancelButton() {
        return this.container + xpath.cancelButton;
    }

    get resetButton() {
        return this.container + xpath.dialogButtonRow + lib.dialogButton('Reset');
    }

    get publicRadioButton() {
        return this.container + lib.radioButtonContainsLabel('Public - Everyone can read');
    }

    get copyFromProjectButton() {
        return this.container + lib.buttonWithSpan('Copy from project');
    }

    get copyFromParentButton() {
        return this.container + lib.buttonWithSpan('Copy from parent');
    }

    get restrictedRadioButton() {
        return this.container + lib.radioButtonContainsLabel('Restricted');
    }

    async waitForRestrictedRadioDisplayed() {
        return await this.waitForElementDisplayed(this.restrictedRadioButton, appConst.shortTimeout);
    }

    async clickOnRestrictedRadioButton() {
        try {
            await this.waitForElementDisplayed(this.restrictedRadioButton, appConst.shortTimeout);
            return await this.clickOnElement(this.restrictedRadioButton);
        } catch (err) {
            await this.handleError('Restricted radio button', 'err_restricted_radio_button', err,);
        }
    }

    async waitForCopyFromParentButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.copyFromParentButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Copy from parent button should be enabled', 'err_copy_from_parent_button', err);
        }
    }

    async clickOnCopyFromParentButton() {
        try {
            await this.waitForElementDisplayed(this.copyFromParentButton, appConst.mediumTimeout);
            return await this.clickOnElement(this.copyFromParentButton);
        } catch (err) {
            await this.handleError('Click on Copy from parent button ', 'err_click_copy_from_parent_button', err);
        }
    }

    async waitForCopyFromParentButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.copyFromParentButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Copy from parent button should be disabled', 'err_copy_from_parent_button', err);
        }
    }

    async waitForCopyFromProjectButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.copyFromProjectButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Copy from project button should be disabled', 'err_copy_from_project_button', err);
        }
    }

    async waitForCopyFromProjectButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.copyFromProjectButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Copy from project button should be enabled', 'err_copy_from_project_button', err);
        }
    }

    async clickOnCopyFromProjectButton() {
        try {
            await this.waitForElementDisplayed(this.copyFromProjectButton, appConst.mediumTimeout);
            return await this.clickOnElement(this.copyFromProjectButton);
        } catch (err) {
            await this.handleError('Click on Copy from project button', 'err_click_copy_from_project_button', err);
        }
    }

    async waitForPublicRadioDisplayed() {
        await this.waitForElementDisplayed(this.publicRadioButton, appConst.shortTimeout);
    }

    async isPublicRadioSelected() {
        await this.waitForPublicRadioDisplayed();
        return await this.isSelected(this.publicRadioButton);
    }

    async isRestrictedRadioSelected() {
        await this.waitForRestrictedRadioDisplayed();
        return await this.isSelected(this.restrictedRadioButton);
    }

    async waitForResetButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.resetButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Reset button should be disabled', 'err_reset_button', err);
        }
    }

    async waitForResetButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.resetButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Reset button should be enabled', 'err_reset_button', err);
        }
    }

    async clickOnResetButton() {
        try {
            await this.waitForElementDisplayed(this.resetButton, appConst.mediumTimeout);
            await this.clickOnElement(this.resetButton);
            await this.pause(400);
        } catch (err) {
            await this.handleError('Click on Reset button', 'err_click_reset_button', err);
        }
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(this.stepDescription, appConst.mediumTimeout);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('PermissionsDialog - General Access Step  was not loaded', 'err_edit_perm_dlg_not_loaded', err);
        }
    }

    waitForDialogClosed() {
        let message = 'Edit Permissions Dialog is not closed! timeout is ' + 3000;
        return this.getBrowser().waitUntil(() => {
            return this.isElementNotDisplayed(this.container);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: message}).then(() => {
            return this.pause(400);
        })
    }

    getDisplayNameOfSelectedPrincipals() {
        let selector = this.container + xpath.aceSelectedOptionsView + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selector);
    }

    getNameOfAccessControlEntries() {
        let selector = this.container + xpath.aceSelectedOptionsView + lib.P_SUB_NAME;
        return this.getTextInElements(selector);
    }

    async removeAclEntry(principalName) {
        try {
            let selector = this.container + xpath.aclEntryByName(principalName) + lib.REMOVE_ICON;
            return await this.clickOnElement(selector)
        } catch (err) {
            await this.handleError(`Remove ACL entry for principal: ${principalName}`, 'err_remove_acl_entry', err);
        }
    }

    async doFilterOptionsInSelector(text) {
        try {
            let accessControlComboBox = new AccessControlComboBox();
            await accessControlComboBox.filterItem(text, this.container);
        } catch (err) {
            await this.handleError(`Filter options in selector with text: ${text}`, 'err_filter_options_in_selector', err);
        }
    }

    async waitForEmptyOptionsMessage() {
        try {
            return await this.waitForElementDisplayed(this.container + lib.EMPTY_OPTIONS_H5, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Edit Permission Selector - Empty options text should appear', 'err_empty_opt', err);
        }
    }

    // filters and selects a principal
    async filterAndSelectPrincipal(principalDisplayName) {
        try {
            let accessControlComboBox = new AccessControlComboBox();
            await accessControlComboBox.selectFilteredPrincipalAndClickOnApply(principalDisplayName, this.container);
            console.log('Edit Permissions Dialog, principal is selected: ' + principalDisplayName);
        } catch (err) {
            await this.handleError(`Filter and select principal: ${principalDisplayName}`, 'err_filter_and_select_principal', err);
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
            await this.handleError(`Principal operations, tab menu button`, 'err_click_on_ace_menu_button', err);
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
            await this.handleError(`Click on Permission Toggle for principal: ${principalName}, operation: ${operationName}`,
                'err_click_on_permission_toggle', err);
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


    async waitForAccessSelectorDisabled(principalName) {
        let locator = xpath.aclEntryByDisplayName(principalName) + xpath.accessSelector;
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, 'class');
            return result.includes("disabled");
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Access selector should be disabled '});
    }

    async waitForAccessSelectorEnabled(principalDisplayName) {
        let locator = xpath.aclEntryByDisplayName(principalDisplayName) + xpath.accessSelector;
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, 'class');
            return !result.includes('disabled');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Access selector should be enabled '});
    }

}

module.exports = EditPermissionsGeneralStep;

