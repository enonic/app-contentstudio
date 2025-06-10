
/**
 * Created on 04.06.2025
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');

const xpath = {
    container: `//div[contains(@id,'EditPermissionsDialog')]`,
    dialogButtonRow: `//div[contains(@class,'button-container')]`,
};

class BaseStepEditPermissionsDialog extends Page {

    get container() {
        return xpath.container;
    }


    get nextButton() {
        return xpath.container + xpath.dialogButtonRow + lib.dialogButton('Next');
    }

    get cancelButtonTop() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
    }

    async clickOnCancelButtonTop() {
        await this.waitForElementDisplayed(this.cancelButton, appConst.mediumTimeout);
        return await this.clickOnElement(this.cancelButton);
    }

    async stepDescription() {
        throw new Error('stepDescription method should be implemented');
    }

    get nextButton() {
        return xpath.container + xpath.dialogButtonRow + lib.dialogButton('Next');
    }

    get backButton() {
        return xpath.container + xpath.dialogButtonRow + lib.dialogButton('Back');
    }

    async waitForNextButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_next_button');
            throw new Error(`Edit Permission - Next button should be enabled, ${screenshot}` + err);
        }
    }

    async waitForNextButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_next_button_disabled');
            throw new Error(`Edit Permissions dialog, Next button should be disabled, screenshot:${screenshot}` + err);
        }
    }

    waitForDialogClosed() {
        let message = "Edit Permissions Dialog is not closed! timeout is " + 3000;
        return this.getBrowser().waitUntil(() => {
            return this.isElementNotDisplayed(xpath.container);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: message}).then(() => {
            return this.pause(400);
        })
    }

    async clickOnNextButton() {
        await this.waitForElementDisplayed(this.nextButton, appConst.mediumTimeout);
        await this.clickOnElement(this.nextButton);
        await this.pause(300);
    }

    async clickOnBackButton() {
        await this.waitForElementDisplayed(this.backButton, appConst.mediumTimeout);
        await this.clickOnElement(this.backButton);
        await this.pause(300);
    }

    async clickOnCancelButtonTop() {
        await this.waitForElementDisplayed(this.cancelButtonTop, appConst.mediumTimeout);
        return await this.clickOnElement(this.cancelButtonTop);
    }
}

module.exports = BaseStepEditPermissionsDialog;

