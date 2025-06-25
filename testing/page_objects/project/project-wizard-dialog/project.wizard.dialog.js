/**
 * Created on 05.08.2022
 */
const Page = require('../../page');
const {BUTTONS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[@role='dialog']",
    title: "//h6[@class='xp-admin-common-main-name']",
    stepDescription: "//header//p[2]",
    buttonRow: "//div[contains(@class,'button-container')]",
    copyFromParentButton: parent => `//button[contains(@id,'Button') and child::span[text()='Copy from ${parent}']]`,
};

class ProjectWizardDialog extends Page {

    get container() {
        return XPATH.container;
    }

    get closeButton() {
        return this.container + BUTTONS.buttonAriaLabel('Close');
    }

    get nextButton() {
        return this.container + BUTTONS.buttonByLabel('Next');
    }

    get previousButton() {
        return this.container + BUTTONS.buttonByLabel('Previous');
    }


    async waitForCopyFromParentButtonNotDisplayed(parent) {
        try {
            let locator = this.container + XPATH.copyFromParentButton(parent)
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_copy_from_parent_button');
            throw new Error(`Copy from parent button is displayed: screenshot ${screenshot} ` + err);
        }
    }

    async waitForCopyFromParentButtonDisplayed(parent) {
        try {
            let locator = this.container + XPATH.copyFromParentButton(parent)
            return await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_copy_from_parent_button');
            throw new Error(`Copy from parent button is not displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForCopyFromParentButtonDisabled(parent) {
        try {
            let locator = this.container + XPATH.copyFromParentButton(parent);
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
            let locator = this.container + XPATH.copyFromParentButton(parent);
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
            let locator = this.container + XPATH.copyFromParentButton(parent);
            await this.waitForCopyFromParentButtonDisplayed(parent);
            let elements = await this.getDisplayedElements(locator);
            return await elements[0].click();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_copy_from_parent_button');
            throw new Error(`Click on 'Copy from parent' button, screenshot:${screenshot} ` + err);
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

    async waitForPreviousButtonDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.previousButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Previous button is not displayed', 'err_previous_button', err);
        }
    }

    async clickOnCloseButton() {
        try {
            await this.clickOnElement(this.closeButton);
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.handleError('Error occurred during clicking on Close button', 'err_close_button', err);
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.saveProjectTimeout);
        } catch (err) {
           await this.handleError('Project Wizard dialog was not closed', 'err_dialog_not_closed', err);
        }
    }

    async getTitle() {
        return await this.getText(this.container + XPATH.title);
    }

    async getStepDescription() {
        let locator = this.container + XPATH.stepDescription;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async clickOnBackButton() {
        try {
            await this.waitForPreviousButtonDisplayed();
            await this.waitForElementEnabled(this.previousButton, appConst.mediumTimeout);
            return await this.clickOnElement(this.previousButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_back_button');
            throw new Error('Error after clicking on Back button, Screenshot: ' + screenshot + '  ' + err);
        }
    }
}

module.exports = ProjectWizardDialog;
