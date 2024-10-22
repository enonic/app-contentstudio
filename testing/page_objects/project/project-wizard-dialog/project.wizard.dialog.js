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
    copyFromParentButton: parent => `//button[contains(@id,'Button') and child::span[text()='Copy from ${parent}']]`,
};

class ProjectWizardDialog extends Page {

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get nextButton() {
        return XPATH.container + lib.dialogButton('Next');
    }

    get backButton() {
        return XPATH.container + lib.dialogButton('Back');
    }

    get skipButton() {
        return XPATH.container + lib.dialogButton('Skip');
    }

    async waitForSkipButtonDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.skipButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_skip_button'));
            throw new Error('Skip button is not displayed: ' + err);
        }
    }

    async waitForCopyFromParentButtonNotDisplayed(parent) {
        try {
            let locator = XPATH.container + XPATH.copyFromParentButton(parent)
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_copy_from_parent_button');
            throw new Error(`Copy from parent button is displayed: screenshot ${screenshot} ` + err);
        }
    }

    async waitForCopyFromParentButtonDisplayed(parent) {
        try {
            let locator = XPATH.container + XPATH.copyFromParentButton(parent)
            return await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_copy_from_parent_button');
            throw new Error(`Copy from parent button is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForCopyFromParentButtonDisabled(parent) {
        try {
            let locator = XPATH.container + XPATH.copyFromParentButton(parent);
            await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
            let elements = await this.getDisplayedElements(locator);
            await elements[0].waitForEnabled(
                {timeout: appConst.mediumTimeout, reverse: true, timeoutMsg: 'Copy button should be disabled!'});
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_copy_from_parent_button');
            throw new Error(`Copy from parent button is not disabled, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForCopyFromParentButtonEnabled(parent) {
        try {
            let locator = XPATH.container + XPATH.copyFromParentButton(parent);
            await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
            let elements = await this.getDisplayedElements(locator);
            await elements[0].waitForEnabled(
                {timeout: appConst.mediumTimeout, timeoutMsg: 'Copy button should be enabled!'});
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_copy_from_parent_button');
            throw new Error(`Copy from parent button is not enabled, screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnCopyFromParentButton(parent) {
        try {
            let locator = XPATH.container + XPATH.copyFromParentButton(parent);
            await this.waitForCopyFromParentButtonDisplayed(parent);
            let elements = await this.getDisplayedElements(locator);
            return await elements[0].click();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_copy_from_parent_button');
            throw new Error(`Click on 'Copy from parent' button, screenshot:${screenshot} ` + err);
        }
    }

    async waitForSkipButtonEnabled() {
        try {
            await this.waitForSkipButtonDisplayed();
            return await this.waitForElementEnabled(this.skipButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_skip_button');
            throw new Error(`Skip button is not enabled: screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnSkipButton() {
        try {
            await this.waitForSkipButtonDisplayed();
            await this.waitForSkipButtonEnabled();
            await this.clickOnElement(this.skipButton);
            return await this.pause(300);
        } catch (err) {
            throw new Error("Error occurred during clicking on Skip button: " + err);
        }
    }

    async waitForNextButtonDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_next_button');
            throw new Error(`'Next' button is not displayed:screenshot ${screenshot} ` + err);
        }
    }

    async waitForNextButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_next_disabled');
            throw new Error(" 'Next' button is not enabled. Screenshot: " + screenshot + ' ' + err);
        }
    }

    async waitForNextButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_next_enabled');
            throw new Error('Next button is not disabled Screenshot: ' + screenshot + '  ' + err);
        }
    }

    async clickOnNextButton() {
        try {
            await this.waitForNextButtonDisplayed();
            await this.waitForNextButtonEnabled();
            await this.pause(500);
            await this.clickOnElement(this.nextButton);
            return await this.pause(300);
        } catch (err) {
            throw new Error("Error occurred during clicking on Next button: " + err);
        }
    }

    async waitForBackButtonDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.backButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_back_button');
            throw new Error('Back button is not displayed: screenshot ' + screenshot + ' ' + err);
        }
    }

    async clickOnCancelButtonTop() {
        try {
            await this.clickOnElement(this.cancelButtonTop);
            return await this.waitForDialogClosed();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_cancel_button');
            throw new Error('Project Wizard dialog, error when clicking on Cancel(Top) button  ' + err);
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.saveProjectTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_wizard_not_closed');
            throw new Error('Project Wizard dialog should be closed, screenshot ' + screenshot + '  ' + err);
        }
    }

    async waitForCancelButtonTopDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.cancelButtonTop, appConst.shortTimeout);
        } catch (err) {
            throw new Error('Project Wizard dialog - Cancel button is not displayed :' + err);
        }
    }

    async getTitle() {
        return await this.getText(XPATH.container + XPATH.title);
    }

    async getStepDescription() {
        await this.waitForElementDisplayed(XPATH.container + XPATH.stepDescription, appConst.mediumTimeout);
        return await this.getText(XPATH.container + XPATH.stepDescription);
    }

    async clickOnBackButton() {
        try {
            await this.waitForBackButtonDisplayed();
            await this.waitForElementEnabled(this.backButton, appConst.mediumTimeout);
            return await this.clickOnElement(this.backButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_back_button');
            throw new Error('Error after clicking on Back button, Screenshot: ' + screenshot + '  ' + err);
        }
    }
}

module.exports = ProjectWizardDialog;
