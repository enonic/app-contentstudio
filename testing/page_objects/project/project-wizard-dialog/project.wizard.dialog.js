/**
 * Created on 05.08.2022
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'ProjectWizardDialog')]",
    title: "//h6[@class='xp-admin-common-main-name']",
    stepDescription: "//p[@class='xp-admin-common-sub-name']",
    buttonRow: "//div[contains(@class,'button-container')]",
    nextButton: "//button[contains(@id,'DialogButton') and child::span[text()='Next']]",
    previousButton: "//button[contains(@id,'DialogButton') and child::span[text()='Previous']]",
    skipButton: "//button[contains(@id,'DialogButton') and child::span[text()='Skip']]",
};

class ProjectWizardDialog extends Page {

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get nextButton() {
        return XPATH.container + XPATH.nextButton;
    }

    get previousButton() {
        return XPATH.container + XPATH.previousButton;
    }

    get skipButton() {
        return XPATH.container + XPATH.skipButton;
    }

    async waitForSkipButtonDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.skipButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_skip_button"));
            throw new Error("Skip button is not displayed: " + err);
        }
    }

    async waitForSkipButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.skipButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_skip_button"));
            throw new Error("Skip button is not enabled: " + err);
        }
    }

    async clickOnSkipButton() {
        await this.waitForSkipButtonDisplayed();
        await this.waitForSkipButtonEnabled();
        return await this.clickOnElement(this.skipButton);
    }

    async waitForNextButtonDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_next_button"));
            throw new Error("Next button is not displayed: " + err);
        }
    }

    async waitForNextButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_next_disabled");
            await this.saveScreenshot(appConst.generateRandomName("err_next_button"));
            throw new Error("Next button is not enabled. Screenshot: " + screenshot + " " + err);
        }
    }

    async waitForNextButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_next_enabled");
            await this.saveScreenshot(screenshot);
            throw new Error("Next button is not disabled Screenshot: " + screenshot + "  " + err);
        }
    }

    async clickOnNextButton() {
        await this.waitForNextButtonDisplayed();
        await this.waitForNextButtonEnabled();
        await this.clickOnElement(this.nextButton);
        return await this.pause(300);
    }

    async waitForPreviousButtonDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.previousButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_prev_button"));
            throw new Error("Previous button is not displayed: " + err);
        }
    }

    async clickOnCancelButtonTop() {
        try {
            await this.clickOnElement(this.cancelButtonTop);
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_cancel_button'));
            throw new Error('Layers Content Tree dialog, error when clicking on Cancel(Top) button  ' + err);
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.saveProjectTimeout);
        } catch (err) {
            throw new Error("Layers Content Tree dialog should be closed " + err);
        }
    }

    async waitForCancelButtonTopDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.cancelButtonTop, appConst.shortTimeout);
        } catch (err) {
            throw new Error("Layers Content Tree dialog dialog - Cancel button is not displayed :" + err);
        }
    }

    async getTitle() {
        return await this.getText(XPATH.container + XPATH.title);
    }

    async getStepDescription() {
        return await this.getText(XPATH.container + XPATH.stepDescription);
    }

}

module.exports = ProjectWizardDialog;

