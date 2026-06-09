/**
 * Created on 11.07.2023
 */
const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[@data-component='ProjectSelectionDialog']`,
    title: "//h2[text()='Create project']",
};

class ProjectNotAvailableDialog extends Page {

    get startWizardButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Start Wizard');
    }

    async clickOnStartWizardButton() {
        try {
            await this.clickOnElement(this.startWizardButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Error when clicking on Start Wizard button in Project Not Available dialog',
                'err_click_start_wizard_btn', err);
        }
    }

    async waitForDialogLoaded() {
        try {
            let selector = XPATH.container + XPATH.title;
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Project not available dialog should be loaded!', 'err_project_not_available_dialog', err);
        }
    }

    async waitForDialogClosed() {
        try {
            let selector = XPATH.container + XPATH.title;
            return await this.waitForElementNotDisplayed(selector, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Project not available dialog should be closed!', 'err_project_not_available_dialog_closed', err);
        }
    }

    getTitle() {
        return this.getText(XPATH.container + XPATH.title);
    }
}

module.exports = ProjectNotAvailableDialog;

