/**
 * Created on 10.04.2020.
 */
const wizards = require('./wizard.panel');
const wpXpath = require('./wizard.panel').XPATH;
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');

const XPATH = {
    container: "//div[contains(@id,'UserWizardPanel')]",
    emailInput: "//input[@type = 'email']",
    groupOptionsFilterInput: "//div[contains(@id,'FormItem') and child::label[text()='Groups']]" + lib.COMBO_BOX_OPTION_FILTER_INPUT,
    roleOptionsFilterInput: "//div[contains(@id,'FormItem') and child::label[text()='Roles']]" + lib.COMBO_BOX_OPTION_FILTER_INPUT,
    rolesGroupLink: "//li[child::a[text()='Roles & Groups']]",
    passwordGenerator: "//div[contains(@id,'PasswordGenerator')]",
    showPasswordLink: "//a[@data-i18n='Show']",
    hidePasswordLink: "//a[@data-i18n='Hide']",
    generatePasswordLink: "//a[text()='Generate']",
    changePasswordButton: "//button[contains(@class,'change-password-button')]",
};

class UserWizard extends wizards.WizardPanel {

    get deleteButton() {
        return XPATH.container + wpXpath.deleteButton;
    }

    get emailInput() {
        return XPATH.container + XPATH.emailInput;
    }

    get passwordInput() {
        return XPATH.container + "//input[@type = 'password']";
    }

    get groupOptionsFilterInput() {
        return XPATH.container + XPATH.groupOptionsFilterInput;
    }

    get roleOptionsFilterInput() {
        return XPATH.container + XPATH.roleOptionsFilterInput;
    }

    get rolesGroupsLink() {
        return XPATH.container + XPATH.rolesGroupLink;
    }

    get showPasswordLink() {
        return XPATH.container + XPATH.showPasswordLink;
    }

    get hidePasswordLink() {
        return XPATH.container + XPATH.hidePasswordLink;
    }

    get generateLink() {
        return XPATH.container + XPATH.generatePasswordLink;
    }

    get changePasswordButton() {
        return XPATH.container + XPATH.changePasswordButton;
    }

    isShowLinkDisplayed() {
        return this.isElementDisplayed(this.showPasswordLink);
    }

    isHidePasswordLinkDisplayed() {
        return this.isElementDisplayed(this.hidePasswordLink);
    }

    clickOnChangePasswordButton() {
        return this.clickOnElement(this.changePasswordButton);
    }

    clickOnGenerateLink() {
        return this.clickOnElement(this.generateLink);
    }

    isEmailInputDisplayed() {
        return this.isElementDisplayed(this.emailInput);
    }

    isPasswordInputDisplayed() {
        return this.isElementDisplayed(this.passwordInput);
    }

    isGroupOptionsFilterInputDisplayed() {
        return this.isElementDisplayed(this.groupOptionsFilterInput);
    }

    isRoleOptionsFilterInputDisplayed() {
        return this.isElementDisplayed(this.roleOptionsFilterInput);
    }

    clickOnRolesAndGroupsLink() {
        return this.clickOnElement(this.rolesGroupsLink);
    }

    getUserName() {
        return this.getTextInInput(this.displayNameInput).catch(err => {
            throw new Error('error when get text from display name input ' + err);
        })
    }

    clearPasswordInput() {
        return this.clearInputText(this.passwordInput).then(() => {
            return this.typeTextInInput(this.passwordInput, 'a');
        }).then(() => {
            return this.getBrowser().keys('\uE003');
        });
    }

    clearEmailInput() {
        return this.clearInputText(this.emailInput).then(() => {
            return this.typeTextInInput(this.emailInput, 'a');
        }).then(() => {
            return this.getBrowser().keys('\uE003');
        });
    }

    getTextInPasswordInput() {
        return this.getTextInInput(this.passwordInput).catch(err => {
            this.saveScreenshot("err_get_text_password");
            throw new Error('Error when getting text in password input ' + err);
        });
    }

    //clicks on Remove icon and removes the role
    removeRole(roleDisplayName) {
        let removeIconSelector = XPATH.container + `${lib.selectedPrincipalByDisplayName(roleDisplayName)}` + lib.REMOVE_ICON;
        return this.clickOnElement(removeIconSelector).then(() => {
            return this.pause(500);
        })
    }

    addRoles(roleDisplayNames) {
        let result = Promise.resolve();
        roleDisplayNames.forEach(displayName => {
            result = result.then(() => this.filterOptionsAndAddRole(displayName));
        });
        return result;
    }

    async filterOptionsAndAddRole(roleDisplayName) {
        let loaderComboBox = new LoaderComboBox();
        try {
            return await loaderComboBox.typeTextAndSelectOption(roleDisplayName, XPATH.container);
        } catch (err) {
            throw new Error('Error when selecting the role: ' + roleDisplayName + ' ' + err);
        }
    }

    typeEmail(email) {
        return this.typeTextInInput(this.emailInput, email);
    }

    typePassword(password) {
        return this.typeTextInInput(this.passwordInput, password);
    }

    typeDataAndGeneratePassword(user) {
        return this.typeDisplayName(user.displayName).then(() => {
            return this.typeEmail(user.email);
        }).then(() => {
            return this.clickOnGenerateLink();
        }).then(() => {
            return this.pause(500);
        }).then(() => {
            if (user.roles != null) {
                return this.addRoles(user.roles);
            }
        })
    }

    typeData(user) {
        return this.typeDisplayName(user.displayName).then(() => {
            return this.typeEmail(user.email);
        }).then(() => {
            return this.typePassword(user.password);
        }).then(() => {
            return this.pause(500);
        }).then(() => {
            if (user.roles != null) {
                return this.addRoles(user.roles);
            }
        })
    }

    waitForOpened() {
        return this.waitForElementDisplayed(this.displayNameInput, appConst.mediumTimeout).catch(err => {
            throw new Error('User Wizard is not loaded! ' + err);
        });
    }
};
module.exports = UserWizard;

