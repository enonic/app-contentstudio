/**
 * Created on 12.09.2017.
 */
const WizardPanel = require('./wizard.panel').WizardPanel;
const baseXpath = require('./wizard.panel').XPATH;
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'RoleWizardPanel')]`,
    memberOptionsFilterInput: "//div[contains(@id,'FormItem') and child::label[text()='Members']]" + lib.COMBO_BOX_OPTION_FILTER_INPUT,
};

class RoleWizard extends WizardPanel {

    get descriptionInput() {
        return xpath.container + `//div[contains(@id,'PrincipalDescriptionWizardStepForm')]` + lib.TEXT_INPUT;
    }

    get deleteButton() {
        return xpath.container + baseXpath.deleteButton;
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(xpath.container + this.displayNameInput, appConst.mediumTimeout).catch(e => {
            throw new Error("Role wizard was not loaded! " + e);
        });
    }

    getDescription() {
        return this.getTextInInput(this.descriptionInput);
    }

    typeDescription(description) {
        return this.typeTextInInput(this.descriptionInput, description);
    }

    async typeData(data) {
        await this.typeTextInInput(this.displayNameInput, data.displayName);
        return await this.typeTextInInput(this.descriptionInput, data.description);
    }

    clickOnDelete() {
        return this.clickOnElement(this.deleteButton).catch(err => {
            this.saveScreenshot('err_delete_button_in_role_wizard', err);
            throw new Error("Role wizard - " + err);
        });
    }

    waitForDeleteButtonEnabled() {
        return this.waitForElementEnabled(this.deleteButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_delete_role_button_disabled');
            throw new Error("Role wizard, Delete button " + err);
        });
    }

    waitForDeleteButtonDisabled() {
        return this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_delete_role_button_should_be_disabled');
            throw new Error("Role wizard, Delete button should be disabled " + err);
        });
    }

    getMembers() {
        let selectedOptions = xpath.container + lib.PRINCIPAL_SELECTED_OPTION + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(selectedOptions).catch(err => {
            throw new Error('Error when getting text from elements ')
        });
    }
}

module.exports = RoleWizard;

