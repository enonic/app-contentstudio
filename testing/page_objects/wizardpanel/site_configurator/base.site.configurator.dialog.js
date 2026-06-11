const Page = require('../../page');
const {BUTTONS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[@data-component='Dialog.Content']`,
};

class BaseSiteConfiguratorDialog extends Page {

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }


    get applyButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Apply');
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
