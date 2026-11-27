/**
 * Created on 05.08.2022
 */
const Page = require('../../page');
const { BUTTONS } = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    title: "//h6[@class='xp-admin-common-main-name']",
    stepDescription: '//header//p[2]',
    buttonRow: "//div[contains(@class,'button-container')]",
    copyFromParentButton: (parent) => `//button[@data-component='InlineButton' and text()='Copy from ${parent}']`,
};

class ProjectWizardDialog extends Page {
    get container() {
        throw new Error(`${this.constructor.name}: override getter 'container' in subclass`);
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
            let locator = this.container + XPATH.copyFromParentButton(parent);
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Project Wizard - 'Copy from ${parent}' button should not be displayed`,
                'err_copy_from_parent_displayed',
                err,
            );
        }
    }

    async waitForCopyFromParentButtonDisplayed(parent) {
        try {
            let locator = this.container + XPATH.copyFromParentButton(parent);
            return await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                `Project Wizard - 'Copy from ${parent}' button should be displayed`,
                'err_copy_from_parent_not_displayed',
                err,
            );
        }
    }

    async waitForCopyFromParentButtonDisabled(parent) {
        try {
            let button = await this.findCopyFromParentButton(parent);
            await button.waitForEnabled({
                timeout: appConst.mediumTimeout,
                reverse: true,
                timeoutMsg: `'Copy from ${parent}' button is still enabled after ${appConst.mediumTimeout} ms`,
            });
        } catch (err) {
            await this.handleError(
                `Project Wizard - 'Copy from ${parent}' button should be disabled`,
                'err_copy_from_parent_enabled',
                err,
            );
        }
    }

    async waitForCopyFromParentButtonEnabled(parent) {
        try {
            let button = await this.findCopyFromParentButton(parent);
            await button.waitForEnabled({
                timeout: appConst.mediumTimeout,
                timeoutMsg: `'Copy from ${parent}' button is still disabled after ${appConst.mediumTimeout} ms`,
            });
        } catch (err) {
            await this.handleError(
                `Project Wizard - 'Copy from ${parent}' button should be enabled`,
                'err_copy_from_parent_disabled',
                err,
            );
        }
    }

    async clickOnCopyFromParentButton(parent) {
        try {
            let button = await this.findCopyFromParentButton(parent);
            return await button.click();
        } catch (err) {
            await this.handleError(
                `Project Wizard - tried to click on 'Copy from ${parent}' button`,
                'err_click_copy_from_parent',
                err,
            );
        }
    }

    // Waits for the button and returns the displayed element. Errors are handled by the callers.
    async findCopyFromParentButton(parent) {
        let locator = this.container + XPATH.copyFromParentButton(parent);
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        let elements = await this.getDisplayedElements(locator);
        if (elements.length === 0) {
            throw new Error(`'Copy from ${parent}' button was not found, locator: ${locator}`);
        }
        return elements[0];
    }

    async waitForNextButtonDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError("Project Wizard - 'Next' button should be displayed", 'err_next_not_displayed', err);
        }
    }

    async waitForNextButtonEnabled() {
        try {
            await this.waitForElementClickable(this.nextButton);
            return await this.waitForElementEnabled(this.nextButton);
        } catch (err) {
            await this.handleError("Project Wizard - 'Next' button should be enabled", 'err_next_disabled', err);
        }
    }

    async waitForNextButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.nextButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError("Project Wizard - 'Next' button should be disabled", 'err_next_enabled', err);
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
            await this.handleError("Project Wizard - tried to click on 'Next' button", 'err_click_next', err);
        }
    }

    async waitForPreviousButtonDisplayed() {
        try {
            return await this.waitUntilDisplayed(this.previousButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(
                "Project Wizard - 'Previous' button should be displayed",
                'err_previous_not_displayed',
                err,
            );
        }
    }

    async clickOnPreviousButton() {
        try {
            await this.waitForPreviousButtonDisplayed();
            await this.waitForElementEnabled(this.previousButton, appConst.mediumTimeout);
            return await this.clickOnElement(this.previousButton);
        } catch (err) {
            await this.handleError("Project Wizard - tried to click on 'Previous' button", 'err_click_previous', err);
        }
    }

    async clickOnCloseButton() {
        try {
            await this.clickOnElement(this.closeButton);
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.handleError("Project Wizard - tried to click on 'Close' button", 'err_click_close', err);
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(this.container, appConst.saveProjectTimeout);
        } catch (err) {
            await this.handleError('Project Wizard - the dialog should be closed', 'err_dialog_not_closed', err);
        }
    }

    async getTitle() {
        try {
            return await this.getText(this.container + XPATH.title);
        } catch (err) {
            await this.handleError('Project Wizard - tried to get the title', 'err_wizard_title', err);
        }
    }

    async getStepDescription() {
        try {
            let locator = this.container + XPATH.stepDescription;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(
                'Project Wizard - tried to get the step description',
                'err_wizard_step_description',
                err,
            );
        }
    }
}

module.exports = ProjectWizardDialog;
