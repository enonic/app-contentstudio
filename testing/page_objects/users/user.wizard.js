/**
 * Created on 10.04.2020.
 */
const wizards = require('./wizard.panel');
const wpXpath = require('./wizard.panel').XPATH;
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const UsersPrincipalCombobox = require('./selectors/users.principal.combobox');

const XPATH = {
    container: "//div[contains(@id,'UserWizardPanel')]",
    emailInput: "//input[@type = 'email']",
    groupsForm: "//div[contains(@id,'FormItem') and descendant::span[text()='Groups']]",
    rolesForm: "//div[contains(@id,'FormItem') and descendant::span[text()='Roles']]",
    publicKeyFormItem: "//div[contains(@id,'FormItem') and descendant::span[contains(.,'Public Keys')]]",
    rolesGroupLink: "//li[child::a[text()='Roles & Groups']]",
    passwordGenerator: "//div[contains(@id,'PasswordGenerator')]",
    showPasswordLink: "//a[@data-i18n='Show']",
    hidePasswordLink: "//a[@data-i18n='Hide']",
    generatePasswordLink: "//a[text()='Generate']",
    setPasswordButton: "//button[contains(@class,'password-button')]/span[text()='Set Password']",
    passwordSectionRemoveIcon: "//fieldset[descendant::div[contains(@id,'PasswordSection')]]//a[contains(@class,'remove')]",
    publicKeysGrid: "//div[contains(@id,'PublicKeysGrid')]",
    publicKeysGridRow: "//div[contains(@class,'public-keys-grid-row')]",
    removePublicKeyIcon: "//a[contains(@class,'remove-public-key icon-close')]",
    showKeyDetailsLinkByLabel:
        label => `//div[contains(@class,'public-keys-grid-row') and descendant::div[text()='${label}']]//a[contains(@class,'show-public-key')]`,
};

class UserWizard extends wizards.WizardPanel {

    get deleteButton() {
        return XPATH.container + wpXpath.deleteButton;
    }

    get passwordInput() {
        return XPATH.container + "//input[@type = 'text' and contains(@class,'password-input')]";
    }

    get emailInput() {
        return XPATH.container + XPATH.emailInput;
    }

    get groupOptionsFilterInput() {
        return XPATH.container + XPATH.groupsForm + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    get roleOptionsFilterInput() {
        return XPATH.container + XPATH.rolesForm + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    get rolesGroupsLink() {
        return XPATH.container + XPATH.rolesGroupLink;
    }

    get setPasswordButton() {
        return XPATH.container + XPATH.setPasswordButton;
    }

    get clearPasswordButton() {
        return XPATH.container + "//button[contains(.,'Clear Password')]";
    }

    get addPublicKeyButton() {
        return XPATH.container + XPATH.publicKeyFormItem + '//button';
    }

    get hidePasswordLink() {
        return XPATH.container + XPATH.hidePasswordLink;
    }

    get generateLink() {
        return XPATH.container + XPATH.generatePasswordLink;
    }

    get showPasswordLink() {
        return XPATH.container + XPATH.showPasswordLink;
    }

    get changePasswordButton() {
        return XPATH.container + "//button[contains(@class,'change-password-button') and child::span[contains(.,'Change Password')]]";
    }

    async clickOnChangePasswordButton() {
        try {
            await this.waitForChangePasswordButtonDisplayed();
            return await this.clickOnElement(this.changePasswordButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_change_password_btn');
            throw new Error(`Error occurred during clicking on 'Change Password' button, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForChangePasswordButtonDisplayed() {
        return await this.waitForElementDisplayed(this.changePasswordButton, appConst.mediumTimeout);
    }

    async waitForChangePasswordButtonNotDisplayed() {
        return await this.waitForElementNotDisplayed(this.changePasswordButton, appConst.mediumTimeout);
    }

    async clickOnGenerateLink() {
        return await this.clickOnElement(this.generateLink);
    }

    waitForHidePasswordLinkDisplayed() {
        return this.waitForElementDisplayed(this.hidePasswordLink, appConst.mediumTimeout);
    }

    async waitForAddPublicKeyButtonDisplayed() {
        return await this.waitForElementDisplayed(this.addPublicKeyButton, appConst.mediumTimeout);
    }

    async clickOnAddPublicKeyButton() {
        await this.waitForAddPublicKeyButtonDisplayed();
        await this.clickOnElement(this.addPublicKeyButton);
    }

    async getNumberOfKeyRows() {
        let locator = XPATH.container + "//div[contains(@class,'public-keys-grid-body')]" + XPATH.publicKeysGridRow;
        let result = await this.findElements(locator);
        return result.length;
    }

    async clickOnRemovePublicKeyIcon(index) {
        let locator = XPATH.container + XPATH.publicKeysGridRow + XPATH.removePublicKeyIcon;
        await this.waitForElementDisplayed(locator);
        let elements = await this.findElements(locator);
        return await elements[index].click();
    }

    async clickOnShowKeyDetailsLink(label) {
        let locator = XPATH.showKeyDetailsLinkByLabel(label);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }

    async clickOnSetPasswordButton() {
        try {
            await this.waitForSetPasswordButtonDisplayed();
            await this.clickOnElement(this.setPasswordButton);
            await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_set_password_btn');
            throw new Error(`Error occurred when tried to click on 'Set Password' button, screenshot: ${screenshot} ` + err);
        }
    }

    isSetPasswordButtonDisplayed() {
        return this.isElementDisplayed(this.setPasswordButton);
    }

    waitForSetPasswordButtonDisplayed() {
        return this.waitForElementDisplayed(this.setPasswordButton, appConst.mediumTimeout);
    }

    isEmailInputDisplayed() {
        return this.isElementDisplayed(this.emailInput);
    }

    isGroupOptionsFilterInputDisplayed() {
        return this.isElementDisplayed(this.groupOptionsFilterInput);
    }

    isRoleOptionsFilterInputDisplayed() {
        return this.isElementDisplayed(this.roleOptionsFilterInput);
    }

    async clickOnRolesAndGroupsLink() {
        await this.clickOnElement(this.rolesGroupsLink);
        await this.pause(1000);
    }

    getUserName() {
        return this.getTextInInput(this.displayNameInput).catch(err => {
            throw new Error('error when get text from display name input ' + err);
        })
    }

    async clickOnDelete() {
        try {
            await this.waitForDeleteButtonEnabled();
            await this.clickOnElement(this.deleteButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_delete_btn');
            throw new Error(`Error occurred after clicking on Delete button, screenshot:${screenshot} ` + err);
        }
    }

    async waitForDeleteButtonEnabled() {
        await this.waitForElementEnabled(this.deleteButton, appConst.mediumTimeout);
    }

    async clearEmailInput() {
        await this.clearInputText(this.emailInput);
        await this.typeTextInInput(this.emailInput, 'a');
        return await this.getBrowser().keys('\uE003');
    }

    //clicks on Remove icon and removes the role
    async removeRole(roleDisplayName) {
        let removeIconLocator = XPATH.container + `${lib.selectedPrincipalByDisplayName(roleDisplayName)}` + lib.REMOVE_ICON;
        await this.clickOnElement(removeIconLocator);
        return await this.pause(300);
    }

    async waitForRemoveRoleIconNotDisplayed(roleDisplayName) {
        try {
            let removeIconLocator = XPATH.container + `${lib.selectedPrincipalByDisplayName(roleDisplayName)}` + lib.REMOVE_ICON;
            return await this.waitForElementNotDisplayed(removeIconLocator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_remove_icon');
            throw new Error(`Remove role icon should not be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    addRoles(roleDisplayNames) {
        let result = Promise.resolve();
        roleDisplayNames.forEach(displayName => {
            result = result.then(() => this.filterOptionsAndAddRole(displayName));
        });
        return result;
    }

    async getSelectedRoles() {
        let selectedOptions = XPATH.rolesForm + lib.PRINCIPAL_SELECTED_OPTION + lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(selectedOptions);
    }

    async filterOptionsAndAddRole(roleDisplayName) {
        try {
            let usersPrincipalCombobox = new UsersPrincipalCombobox();
            await usersPrincipalCombobox.selectFilteredOptionAndClickOnApply(roleDisplayName, XPATH.container + XPATH.rolesForm);
            await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_role_selector');
            throw new Error(`Error when selecting the role-option, screenshot:${screenshot} ` + err);
        }
    }

    async filterOptionsAndAddGroup(groupDisplayName) {
        let usersPrincipalCombobox = new UsersPrincipalCombobox();
        await usersPrincipalCombobox.selectFilteredOptionAndClickOnApply(groupDisplayName, XPATH.container + XPATH.groupsForm);
        return await this.pause(500);
    }

    async typeEmail(email) {
        try {
            return await this.typeTextInInput(this.emailInput, email);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_email_input');
            throw new Error(`Error during inserting the text in email input, screenshot:${screenshot} ` + err);
        }
    }

    async typeDataAndGeneratePassword(user) {
        await this.typeDisplayName(user.displayName);
        await this.typeEmail(user.email);
        await this.clickOnSetPasswordButton();
        await this.clickOnGeneratePasswordLink();
        await this.clickOnShowPasswordLink();
        let password = await this.getTextInPasswordInput();
        await this.pause(200);
        if (user.roles != null) {
            await this.addRoles(user.roles);
        }
        return password;
    }

    async typeData(user) {
        await this.typeDisplayName(user.displayName);
        await this.typeEmail(user.email);
        if (user.password) {
            await this.clickOnSetPasswordButton();
            await this.typePassword(user.password);
        }
        await this.pause(200);
        if (user.roles != null) {
            await this.addRoles(user.roles);
        }
    }

    async waitForOpened() {
        try {
            return await this.waitForElementDisplayed(this.displayNameInput, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_user_wizard');
            throw new Error(`User Wizard is not loaded! screenshot: ${screenshot} ` + err);
        }
    }

    async getPasswordStatus() {
        let status = await this.getAttribute(XPATH.container + XPATH.passwordGenerator, 'data-i18n');
        if (!status) {
            throw new Error("Password status was not found!");
        }
        return status;
    }

    async clearPasswordInput() {
        await this.clearInputText(this.passwordInput);
        //insert a letter:
        await this.typeTextInInput(this.passwordInput, 'a');
        //press on BACKSPACE, remove the letter:
        return await this.getBrowser().keys('\uE003');
    }

    async getTextInPasswordInput() {
        try {
            return await this.getTextInInput(this.passwordInput);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_get_text_password');
            throw new Error(`Error when getting text in password input , ${screenshot} ` + err);
        }
    }

    async waitForPasswordInputDisplayed() {
        return await this.waitForElementDisplayed(this.passwordInput, appConst.mediumTimeout);

    }

    async waitForPasswordInputNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.passwordInput, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_password_input');
            throw new Error(`Password input should not be displayed, screenshot: ${screenshot} ` + err);
        }

    }

    async typePassword(password) {
        await this.waitForPasswordInputDisplayed();
        return await this.typeTextInInput(this.passwordInput, password);
    }

    async clickOnShowPasswordLink() {
        try {
            await this.waitForElementDisplayed(this.showPasswordLink, appConst.mediumTimeout);
            await this.clickOnElement(this.showPasswordLink);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_password');
            throw new Error("Error after clicking on Show Pass link, screenshot: " + screenshot + '  ' + err);
        }
    }

    async waitForGenerateLinkDisplayed() {
        return await this.waitForElementDisplayed(this.generateLink, appConst.mediumTimeout);
    }

    // Clicks on Generate password link(button)
    async clickOnGeneratePasswordLink() {
        await this.waitForGenerateLinkDisplayed();
        return await this.clickOnElement(this.generateLink);
    }


    async waitForShowPasswordLinkDisplayed() {
        return await this.waitForElementDisplayed(this.showPasswordLink, appConst.mediumTimeout);
    }

    async waitForAddPublicKeyButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.addPublicKeyButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_add_public_key');
            throw new Error(`Add public key button should not be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForClearPasswordButtonDisplayed() {
        return await this.waitForElementDisplayed(this.clearPasswordButton, appConst.mediumTimeout);
    }

    async waitForClearPasswordButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.clearPasswordButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_clear_password');
            throw new Error(`Clear password button should not be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnClearPasswordButton() {
        await this.waitForClearPasswordButtonDisplayed();
        return await this.clickOnElement(this.clearPasswordButton);
    }

    async clickOnRemovePasswordSection() {
        try {
            await this.waitForElementDisplayed(XPATH.container + XPATH.passwordSectionRemoveIcon);
            return await this.clickOnElement(XPATH.container + XPATH.passwordSectionRemoveIcon);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_remove_password_section');
            throw new Error(`Error occurred when tried to click on remove password section icon, screenshot: ${screenshot} ` + err);
        }
    }
}

module.exports = UserWizard;

