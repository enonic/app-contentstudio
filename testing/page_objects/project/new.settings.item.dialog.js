const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'NewSettingsItemDialog')]`,
    title: "//h2[@class='title']"
};

class NewSettingsItemDialog extends Page {

    get cancelButton() {
        return XPATH.container + lib.CANCEL_BUTTON_DIALOG;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnCancelButtonTop() {
        try {
            await this.clickOnElement(this.cancelButtonTop);
            return await this.waitForDialogClosed();
        } catch (err) {
            this.saveScreenshot('err_click_on_cancel_button');
            throw new Error('New Settings dialog, error when clicking on Cancel(Top) button  ' + err);
        }
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(this.cancelButton, appConst.TIMEOUT_2).catch(err => {
            this.saveScreenshot('err_open_insert_anchor_dialog');
            throw new Error('Insert Special Character Dialog should be opened!' + err);
        });
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_2);
    }

    getTitle() {
        return this.getText(XPATH.container + XPATH.title);
    }

    async waitForCancelButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.cancelButton, appConst.TIMEOUT_2);
        } catch (err) {
            throw new Error("New Setting Item dialog - Cancel button is not displayed :" + err);
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
module.exports = NewSettingsItemDialog;

