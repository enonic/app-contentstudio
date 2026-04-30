/**
 * Created on 04.06.2025
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const {BUTTONS} = require('../../libs/elements');

const xpath = {
    header: "//div[@role='dialog' and descendant::p[contains(.,'Permissions:')]]",
    container:"//div[@role='dialog']",
};

class BaseStepEditPermissionsDialog extends Page {

    get container(){
        return xpath.container;
    }
    get nextButton() {
        return this.container + BUTTONS.buttonByLabel('Next');
    }

    get closeButton() {
        return this.container + BUTTONS.buttonAriaLabel('Close');
    }

    async clickOnCloseButton() {
        await this.waitForElementDisplayed(this.closeButton);
        return await this.clickOnElement(this.closeButton);
    }

    async stepDescription() {
        throw new Error('stepDescription method should be implemented');
    }

    get previousButton() {
        return this.container + BUTTONS.buttonByLabel('Previous');
    }

    async waitForNextButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.nextButton);
        } catch (err) {
            await this.handleError('Edit Permissions dialog - Next button should be enabled', 'err_next_button', err);
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

    async waitForDialogClosed() {
        let message = "Edit Permissions Dialog was not closed! timeout is " + 3000;
        await this.getBrowser().waitUntil(async () => {
            return await this.isElementNotDisplayed(xpath.header);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: message});
        await this.pause(400);
    }

    async clickOnNextButton() {
        await this.waitForElementDisplayed(this.nextButton);
        await this.clickOnElement(this.nextButton);
        await this.pause(300);
    }

    async clickOnPreviousButton() {
        await this.waitForElementDisplayed(this.previousButton);
        await this.clickOnElement(this.previousButton);
        await this.pause(300);
    }
}

module.exports = BaseStepEditPermissionsDialog;

