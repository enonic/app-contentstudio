/**
 * Created on 24/03/2020.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'ProjectSelectionDialog')]`,
    title: "//h2[@class='title']"
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
            this.saveScreenshot('err_click_on_cancel_button');
            throw new Error('Project Selection dialog, error when clicking on Cancel(Top) button  ' + err);
        }
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(this.cancelButton, appConst.TIMEOUT_2).catch(err => {
            this.saveScreenshot('err_open_project_selection_dialog');
            throw new Error('Project Selection dialog should be opened!' + err);
        });
    }

    isDialogLoaded() {
        return this.isElementDisplayed(XPATH.container);
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_2);
        } catch (err) {
            throw new Error("Dialog should be closed " + err);
        }
    }

    getTitle() {
        return this.getText(XPATH.container + XPATH.title);
    }

    async waitForCancelButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.cancelButton, appConst.TIMEOUT_2);
        } catch (err) {
            throw new Error("Project Selection dialog - Cancel button is not displayed :" + err);
        }
    }

    waitForCancelButtonTopDisplayed() {
        return this.waitForElementDisplayed(this.cancelButtonTop, appConst.TIMEOUT_2);
    }

    async clickOnProjectItem() {
        let selector = XPATH.container + lib.itemByDisplayName("Project");
        await this.waitForElementDisplayed(selector, appConst.TIMEOUT_2);
        return await this.clickOnElement(selector);
    }
};
module.exports = ProjectSelectionDialog;

