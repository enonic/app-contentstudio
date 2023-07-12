/**
 * Created on 11.07.2023
 */
const Page = require('../page');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'ProjectNotAvailableDialog')]`,
    title: "//h2[@class='title']",
};

class ProjectNotAvailableDialog extends Page {

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get startWizardButton() {
        return XPATH.container + lib.dialogButton('Start Wizard');
    }

    async clickOnCancelButtonTop() {
        try {
            await this.clickOnElement(this.cancelButtonTop);
            return await this.waitForDialogClosed();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_cancel_button');
            throw new Error('Project not available dialog, error when clicking on Cancel(Top) button,screenshot: ' + screenshot + ' ' + err);
        }
    }

    async clickOnStartWizardButton() {
        try {
            await this.clickOnElement(this.startWizardButton);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_start_wizard_btn');
            throw new Error('error when clicking on Start Wizard button, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async waitForDialogLoaded() {
        try {
            let selector = XPATH.container + XPATH.title;
            await this.waitForElementDisplayed(selector, appConst.shortTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_project_not_available_dialog');
            throw new Error('Project not available dialog should be loaded!, screenshot' + screenshot + '  ' + err);
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_project_not_available_closed');
            throw new Error("Project not available dialog should be closed, screenshot: " + screenshot + ' ' + err);
        }
    }

    getTitle() {
        return this.getText(XPATH.container + XPATH.title);
    }

    async waitForCancelButtonTopDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.cancelButtonTop, appConst.shortTimeout);
        } catch (err) {
            throw new Error("Project Selection dialog - Cancel button is not displayed :" + err);
        }
    }
}

module.exports = ProjectNotAvailableDialog;

