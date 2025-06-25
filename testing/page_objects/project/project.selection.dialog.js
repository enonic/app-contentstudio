/**
 * Created on 24/03/2020.
 */
const Page = require('../page');
const {BUTTONS,} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const {Key} = require('webdriverio');

const XPATH = {
    container: `//div[contains(@role,'dialog') and descendant::h2[text()='Select project']]`,
    title: "//h2[@class='title']",
    projectList: "//div[contains(@role,'listbox')]",
    projectListItemByDisplayName: (displayName) => {
        return `//div[@data-component='ProjectLabel' and descendant::span[text()='${displayName}']]`;
    }
};

class ProjectSelectionDialog extends Page {

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    async clickOnCloseButton() {
        try {
            await this.waitForElementDisplayed(this.closeButton, appConst.mediumTimeout);
            await this.clickOnElement(this.cancelButtonTop);
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.handleError('Project Selection dialog, Error occurred while clicking the Close button ', 'err_proj_sel_close_button',
                err);
        }
    }

    async waitForDialogLoaded() {
        try {
            let selector = XPATH.container + "//h2[text()='Select project']";
            return await this.waitForElementDisplayed(selector, appConst.shortTimeout)
        } catch (err) {
            await this.handleError('Project Selection dialog, Error occurred while waiting for the dialog to be loaded',
                'err_wait_proj_sel_dialog', err);
        }
    }

    async isDialogLoaded() {
        try {
            return await this.waitForElementDisplayed(XPATH.container, appConst.TIMEOUT_1);
        } catch (err) {
            return false;
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Project Selection dialog, Error occurred while waiting for the dialog to be closed', err);
        }
    }

    getTitle() {
        return this.getText(XPATH.container + XPATH.title);
    }


    async selectContext(projectDisplayName) {
        try {
            let selector = XPATH.container + XPATH.projectList + XPATH.projectListItemByDisplayName(projectDisplayName);
            await this.waitForElementDisplayed(selector, appConst.longTimeout);
            await this.scrollAndClickOnElement(selector);
        } catch (err) {
            await this.handleError('Project Selection Dialog, tried to select the item', 'err_select_project_context', err);
        }
    }

    async getProjectsDisplayName() {
        let locator = XPATH.container + XPATH.projectList + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(locator);
    }

    async getProjectLanguage(projectDisplayName) {
        let locator = XPATH.container + XPATH.projectList + XPATH.projectListItemByDisplayName(projectDisplayName) + "//span/span";
        return await this.getText(locator);
    }

    async getWarningMessage() {
        let locator = XPATH.container + "//h6[@class='notification-dialog-text']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async waitForSelectedProjectItem(displayName) {
        let locator = XPATH.container + XPATH.projectList + XPATH.projectListItemByDisplayName(displayName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let element = await this.findElement(locator);
        let attr = await element.getAttribute('class');
        return attr.includes('selected');
    }

    async getNameOfSelectedProjectItem() {
        let locator = XPATH.container + XPATH.projectList +
                      `//div[@data-active='true' and child::div[@data-component='ProjectLabel')]//span`;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    press_Shift_Tab() {
        return this.browser.keys([Key.Shift, Key.Tab]);
    }
}

module.exports = ProjectSelectionDialog;

