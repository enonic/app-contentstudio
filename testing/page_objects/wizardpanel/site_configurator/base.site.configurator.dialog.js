const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'SiteConfiguratorDialog')]`,
    applyButton: `//button[contains(@id,'DialogButton') and child::span[text()='Apply']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
};

class BaseSiteConfiguratorDialog extends Page {

    get cancelButton() {
        return XPATH.container + `${XPATH.cancelButton}`;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get applyButton() {
        return XPATH.container + XPATH.applyButton;
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnApplyButton() {
        try {
            await this.clickOnElement(this.applyButton);
            await this.waitForDialogClosed();
            await this.pause(500);
        } catch (err) {
            await this.handleError('Site Configurator Dialog,should be closed after clicking on Apply button', 'err_close_sfg', err);
        }
    }

    waitForApplyButtonDisabled() {
        return this.waitForElementDisabled(this.applyButton, appConst.mediumTimeout);
    }

    waitForDialogOpened() {
        return this.waitForElementDisplayed(this.applyButton, appConst.mediumTimeout);
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }

    async clickOnCancelTopButton() {
        await this.waitForElementDisplayed(this.cancelButtonTop, appConst.mediumTimeout);
        return await this.clickOnElement(this.cancelButtonTop);
    }
}

module.exports = BaseSiteConfiguratorDialog;
