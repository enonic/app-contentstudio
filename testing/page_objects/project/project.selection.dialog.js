/**
 * Created on 24/03/2020.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'ProjectSelectionDialog')]`,
    title: "//h2[@class='title']",
    projectList: "//ul[contains(@id,'ProjectList')]",
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
        let selector = XPATH.container + XPATH.projectList + lib.itemByDisplayName("Default");
        return this.waitForElementDisplayed(selector, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_open_project_selection_dialog');
            throw new Error('Project Selection dialog should be opened!' + err);
        });
    }

    isDialogLoaded() {
        return this.isElementDisplayed(XPATH.container);
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
        let selector = XPATH.container + XPATH.projectList + lib.itemByDisplayName(projectDisplayName);
        await this.waitForElementDisplayed(selector, appConst.longTimeout);
        await this.scrollAndClickOnElement(selector);
        // let browsePanel = new BrowsePanel();
        // await browsePanel.waitForGridLoaded(appConst.longTimeout);
        // return browsePanel;
    }

    async getProjectsDisplayName() {
        let locator = XPATH.container + XPATH.projectList + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(locator);
    }

    async getProjectLanguage(projectDisplayName) {
        let locator = XPATH.container + XPATH.projectList + lib.itemByDisplayName(projectDisplayName) + lib.P_SUB_NAME;
        return this.getText(locator);
    }
};
module.exports = ProjectSelectionDialog;

