/**
 * Created on 06.11.2026
 *
 * Application config dialog opened from the Applications step of the project wizard (Edit icon of a selected app).
 * Available only when an existing project is edited; during project creation the Edit icon is disabled.
 */
const Page = require('../../page');
const { BUTTONS, COMMON } = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const { INPUTS } = COMMON;

const XPATH = {
    container: "//div[@role='dialog' and @data-component='ProjectDialogConfigContent']",
    title: "//h2[@data-component='Dialog.Title']",
    // 'Upload media' button of an image selector, holds the hidden file input:
    uploadButtonDiv: "//div[@data-component='SelectorUploadButton']",
    selectedImageDisplayName: "//div[@data-component='ImageSelectorItemView']//span[contains(@class,'font-semibold')]",
    selectedImageByDisplayName: (displayName) =>
        `//div[@data-component='ImageSelectorItemView']//span[contains(@class,'font-semibold') and text()='${displayName}']`,
};

class ProjectApplicationConfigDialog extends Page {
    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    get applyButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Apply');
    }

    get cancelButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Cancel');
    }

    async waitForDialogOpened() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(
                'Project application config dialog was not loaded',
                'err_project_app_config_dialog',
                err,
            );
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError(
                'Project application config dialog should be closed',
                'err_project_app_config_dialog_closed',
                err,
            );
        }
    }

    async isDialogOpened() {
        return await this.isElementDisplayed(XPATH.container);
    }

    // Returns the application display name shown in the dialog header
    async getTitle() {
        const locator = XPATH.container + XPATH.title;
        await this.waitForElementDisplayed(locator);
        return await this.getText(locator);
    }

    async clickOnCloseButton() {
        try {
            await this.waitForElementDisplayed(this.closeButton);
            await this.clickOnElement(this.closeButton);
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.handleError(
                'Project application config dialog, Close button',
                'err_project_app_config_close',
                err,
            );
        }
    }

    async clickOnApplyButton() {
        try {
            await this.waitForElementDisplayed(this.applyButton);
            await this.clickOnElement(this.applyButton);
            return await this.waitForDialogClosed();
        } catch (err) {
            await this.handleError(
                'Project application config dialog, Apply button',
                'err_project_app_config_apply',
                err,
            );
        }
    }

    // Uploads the image at the absolute path through the hidden file input of the image selector
    // ('Upload media' button itself only opens the browser's file chooser, which WebDriver cannot drive).
    //
    // addValue, not setValue: the input is visually hidden ('sr-only') and there is nothing to clear -
    // the selector empties the input after every pick. 'Send Keys' is the command the WebDriver spec
    // lets through for a file input. The runner drives a chromedriver on this machine, so the browser
    // opens the file by its path itself.
    async uploadImage(inputLabel, filePath) {
        try {
            const locator =
                XPATH.container +
                INPUTS.inputFieldByLabel(inputLabel) +
                XPATH.uploadButtonDiv +
                "//input[@type='file']";
            const fileInput = await this.findElement(locator);
            await fileInput.addValue(filePath);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(
                `Project application config dialog - uploading '${filePath}'`,
                'err_project_app_config_upload',
                err,
            );
        }
    }

    // The uploaded image gets selected in the image selector: waits for the option with the display name
    async waitForImageSelected(inputLabel, imageDisplayName) {
        try {
            const locator =
                XPATH.container +
                INPUTS.inputFieldByLabel(inputLabel) +
                XPATH.selectedImageByDisplayName(imageDisplayName);
            return await this.waitForElementDisplayed(locator, appConst.longTimeout);
        } catch (err) {
            await this.handleError(
                `Project application config dialog - image '${imageDisplayName}' should be selected in '${inputLabel}'`,
                'err_project_app_config_image',
                err,
            );
        }
    }

    // Display names of the selected images in the image selector
    async getSelectedImages(inputLabel) {
        const locator = XPATH.container + INPUTS.inputFieldByLabel(inputLabel) + XPATH.selectedImageDisplayName;
        return await this.getTextInDisplayedElements(locator);
    }

    // Clicks on '+' button in the content selector. A content of the single allowed type is created
    // in the root of the project and its wizard is opened in a new browser tab.
    async clickOnAddNewContentButton(inputLabel) {
        try {
            const locator = XPATH.container + INPUTS.inputFieldByLabel(inputLabel) + BUTTONS.buttonAriaLabel('Add');
            await this.waitForElementDisplayed(locator);
            await this.scrollAndClickOnElement(locator);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(
                `Project application config dialog - 'Add' button in '${inputLabel}'`,
                'err_project_app_config_add_content',
                err,
            );
        }
    }

    async waitForApplyButtonDisabled() {
        return await this.waitForElementDisabled(this.applyButton);
    }

    async waitForApplyButtonEnabled() {
        return await this.waitForElementEnabled(this.applyButton);
    }
}

module.exports = ProjectApplicationConfigDialog;
