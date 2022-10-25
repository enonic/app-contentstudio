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
    backButton: "//button[contains(@id,'DialogButton') and child::span[text()='Back']]",
    skipButton: "//button[contains(@id,'DialogButton') and child::span[text()='Skip']]",
    copyFromParentButton: "//button[contains(@id,'Button') and child::span[text()='Copy from parent']]",
};

class ProjectWizardDialog extends Page {

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get copyFromParentButton() {
        return XPATH.container + XPATH.copyFromParentButton;
    }

    get nextButton() {
        return XPATH.container + XPATH.nextButton;
    }

    get backButton() {
        return XPATH.container + XPATH.backButton;
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

    async waitForCopyFromParentButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.copyFromParentButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_copy_from_parent_button");
            await this.saveScreenshot(screenshot);
            throw new Error("Copy from parent button is displayed: screenshot " + screenshot + "  " + err);
        }
    }

    async waitForCopyFromParentButtonDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.copyFromParentButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_copy_from_parent_button");
            await this.saveScreenshot(screenshot);
            throw new Error("Copy from parent button is not displayed, screenshot: " + screenshot + "  " + err);
        }
    }

    async waitForCopyFromParentButtonDisabled() {
        try {
            await this.waitUntilDisplayed(this.copyFromParentButton, appConst.mediumTimeout);
            let elements = await this.getDisplayedElements(this.copyFromParentButton);
            await elements[0].waitForEnabled(
                {timeout: appConst.mediumTimeout, reverse: true, timeoutMsg: "Copy button should be disabled!"});
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_copy_from_parent_button");
            await this.saveScreenshot(screenshot);
            throw new Error("Copy from parent button is not disabled, screenshot: " + screenshot + "  " + err);
        }
    }

    async waitForCopyFromParentButtonEnabled() {
        try {
            await this.waitUntilDisplayed(this.copyFromParentButton, appConst.mediumTimeout);
            let elements = await this.getDisplayedElements(this.copyFromParentButton);
            await elements[0].waitForEnabled(
                {timeout: appConst.mediumTimeout, timeoutMsg: "Copy button should be enabled!"});
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_copy_from_parent_button");
            await this.saveScreenshot(screenshot);
            throw new Error("Copy from parent button is not disabled, screenshot: " + screenshot + "  " + err);
        }
    }

    async clickOnCopyFromParentButton() {
        try {
            await this.waitForCopyFromParentButtonDisplayed();
            let elements = await this.getDisplayedElements(this.copyFromParentButton);
            return await elements[0].click();
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_copy_from_parent_button");
            await this.saveScreenshot(screenshot);
            throw new Error("Click on 'Copy from parent' button, screenshot: " + screenshot + "  " + err);
        }
    }

    async waitForSkipButtonEnabled() {
        try {
            await this.waitForSkipButtonDisplayed();
            return await this.waitForElementEnabled(this.skipButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_skip_button"));
            throw new Error("Skip button is not enabled: " + err);
        }
    }

    async clickOnSkipButton() {
        await this.waitForSkipButtonDisplayed();
        await this.waitForSkipButtonEnabled();
        await this.clickOnElement(this.skipButton);
        return await this.pause(300);
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
        await this.pause(500);
        await this.clickOnElement(this.nextButton);
        return await this.pause(300);
    }

    async waitForBackButtonDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.backButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_back_button"));
            throw new Error("Back button is not displayed: " + err);
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

    async clickOnBackButton() {
        try {
            await this.waitForBackButtonDisplayed();
            await this.waitForElementEnabled(this.backButton, appConst.mediumTimeout);
            return await this.clickOnElement(this.backButton);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_back_button");
            await this.saveScreenshot(screenshot);
            throw new Error("Error after clicking on Back button, Screenshot: " + screenshot + "  " + err);
        }
    }

}

module.exports = ProjectWizardDialog;
