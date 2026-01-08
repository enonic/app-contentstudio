/**
 * Created on 24/03/2020.
 */
const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const {Key} = require('webdriverio');

const XPATH = {
    container: `//div[contains(@role,'dialog') and descendant::h2[text()='Select project']]`,
    title: "//h2[@class='title']",
    projectList: "//div[contains(@role,'listbox')]",
    projectListItemByDisplayName: (displayName) => {
        return `//div[contains(@data-component,'ProjectLabel') and descendant::span[@class='flex-col' and text()='${displayName}']]`;
    }
};

class ProjectSelectionDialog extends Page {

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    async clickOnCancelButtonTop() {
        try {
            await this.clickOnElement(this.cancelButtonTop);
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.saveScreenshot('err_click_on_cancel_button');
            throw new Error('Project Selection dialog, error when clicking on Cancel(Top) button  ' + err);
        }
    }

    async waitForDialogLoaded() {
        try {
            let selector = XPATH.container + "//h2[text()='Select project']";
            return await this.waitForElementDisplayed(selector, appConst.shortTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_selection_dialog');
            throw new Error(`Project Selection dialog should be opened! screenshot: ${screenshot} ` + err);
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
            throw new Error("Dialog should be closed " + err);
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

    async selectContext(projectDisplayName) {
        try {
            let selector = XPATH.container + XPATH.projectList + lib.SELECT_PROJECT_DIALOG.projectItemByDisplayName(projectDisplayName);
            await this.waitForElementDisplayed(selector, appConst.longTimeout);
            await this.scrollAndClickOnElement(selector);
        }catch (err){
            await this.handleError('Project Selection Dialog, tried to select the item', 'err_select_project_context', err);
        }
    }

    async getProjectsDisplayName() {
        let locator = XPATH.container + XPATH.projectList + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(locator);
    }

    async getProjectLanguage(projectDisplayName) {
        let locator = XPATH.container + XPATH.projectList + lib.itemByDisplayName(projectDisplayName) + lib.P_SUB_NAME;
        return this.getText(locator);
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
        let locator = XPATH.container + XPATH.projectList + `//a[contains(@id,'ProjectListItem') and contains(@class,'selected')]//span[@class='display-name']]`;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    press_Shift_Tab() {
        return this.browser.keys([Key.Shift, Key.Tab]);
    }
}

module.exports = ProjectSelectionDialog;

