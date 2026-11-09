/**
 * Created on 06.11.2026
 *
 * Application config dialog opened from the Applications step of the project wizard (Edit icon of a selected app).
 * Available only when an existing project is edited; during project creation the Edit icon is disabled.
 */
const Page = require('../../page');
const { BUTTONS } = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[@role='dialog' and @data-component='ProjectDialogConfigContent']",
    title: "//h2[@data-component='Dialog.Title']",
};

class ProjectApplicationConfigDialog extends Page {
    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    get applyButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Apply');
    }

    get cancelButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Cancel');
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(
                'Project application config dialog was not loaded',
                'err_project_app_config_dialog',
                err,
            );
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError(
                'Project application config dialog should be closed',
                'err_project_app_config_dialog_closed',
                err,
            );
        }
    }

    async isDialogOpened() {
        return await this.isElementDisplayed(XPATH.container);
    }

    // Returns the application display name shown in the dialog header
    async getTitle() {
        const locator = XPATH.container + XPATH.title;
        await this.waitForElementDisplayed(locator);
        return await this.getText(locator);
    }

    async clickOnCloseButton() {
        try {
            await this.waitForElementDisplayed(this.closeButton);
            await this.clickOnElement(this.closeButton);
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.handleError(
                'Project application config dialog, Close button',
                'err_project_app_config_close',
                err,
            );
        }
    }

    async clickOnApplyButton() {
        try {
            await this.waitForElementDisplayed(this.applyButton);
            await this.clickOnElement(this.applyButton);
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.handleError(
                'Project application config dialog, Apply button',
                'err_project_app_config_apply',
                err,
            );
        }
    }

    async waitForApplyButtonDisabled() {
        return await this.waitForElementDisabled(this.applyButton);
    }

    async waitForApplyButtonEnabled() {
        return await this.waitForElementEnabled(this.applyButton);
    }
}

module.exports = ProjectApplicationConfigDialog;
