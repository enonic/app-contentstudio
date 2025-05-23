const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ImageSelectorDropdown = require('../../components/selectors/image.selector.dropdown');
const ImageStyleSelectorDropdown = require('../../components/selectors/image.style.selector');

const XPATH = {
    container: `//div[contains(@id,'ImageModalDialog')]`,
    uploadButton: "//div[contains(@id,'ImageUploaderEl')]//button[contains(@id,'upload-button')]",
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    updateButton: `//button[contains(@id,'DialogButton') and child::span[text()='Update']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    alignRightButton: "//button[contains(@class,'icon-paragraph-right')]",
    justifyButton: "//button[contains(@class,'icon-paragraph-justify')]",
    alignLeftButton: "//button[contains(@class,'icon-paragraph-left')]",
    alignCenterButton: "//button[contains(@class,'icon-paragraph-center')]",
    styleSelector: `//div[contains(@id,'ImageStyleSelector')]`,
    styleSelectedOptionItem: "//div[contains(@class,'selected-item')]",
    customWidthCheckbox: "//div[contains(@class,'custom-width-checkbox')]",
    imageRangeValue: "//div[contains(@class,'custom-width-range-container')]//span[contains(@class,'custom-width-board')]",
    selectedOptionView: "//div[contains(@id,'ImageStyleSelector')]//div[contains(@id,'SelectedOptionView')]",
    captionInput: "//div[contains(@id,'FormItem') and contains(@class,'caption')]//input",
    accessibilityForm: "//div[contains(@class,'input-view image-accessibility')]",
    contentSelectedOptionDiv: "//div[contains(@id,'ContentSelectedOptionView')]",
};

class InsertImageDialog extends Page {

    get imageStyleSelector() {
        return XPATH.container + XPATH.styleSelector;
    }

    get removeContentSelectedOptionIcon() {
        return XPATH.container + XPATH.contentSelectedOptionDiv + lib.REMOVE_ICON;
    }

    get editContentSelectedOptionIcon() {
        return XPATH.container + XPATH.contentSelectedOptionDiv + lib.EDIT_ICON;
    }

    get accessibilityDecorativeImageRadioButton() {
        return XPATH.container + XPATH.accessibilityForm + lib.radioButtonByLabel('Decorative image');
    }

    get accessibilityAlternativeTextRadioButton() {
        return XPATH.container + XPATH.accessibilityForm + lib.radioButtonByLabel('Alternative text');
    }

    get accessibilityAlternativeTextInput() {
        return XPATH.container + XPATH.accessibilityForm + lib.TEXT_INPUT;
    }

    get imageOptionsFilterInput() {
        return XPATH.container + lib.OPTION_FILTER_INPUT;
    }


    get captionInput() {
        return XPATH.container + XPATH.captionInput;
    }

    get customWidthCheckbox() {
        return XPATH.container + XPATH.customWidthCheckbox;
    }


    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get uploadButton() {
        return XPATH.container + XPATH.uploadButton;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get insertButton() {
        return XPATH.container + XPATH.insertButton;
    }

    get updateButton() {
        return XPATH.container + XPATH.updateButton;
    }

    get styleSelectorDropDownHandle() {
        return XPATH.container + XPATH.styleSelector + lib.DROP_DOWN_HANDLE;
    }

    async waitForAlternativeTextRadioButtonDisplayed() {
        return await this.waitForElementDisplayed(this.accessibilityAlternativeTextRadioButton, appConst.shortTimeout);
    }

    async waitForDecorativeImageRadioButtonDisplayed() {
        return await this.waitForElementDisplayed(this.accessibilityDecorativeImageRadioButton, appConst.shortTimeout);
    }

    async clickOnDecorativeImageRadioButton() {
        try {
            await this.waitForDecorativeImageRadioButtonDisplayed();
            await this.pause(500);
            await this.clickOnElement(this.accessibilityDecorativeImageRadioButton);
            return await this.pause(200);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_clicking_on_decorative_radio');
            throw new Error(`Error occurred after clicking on Decorative Image Radio Button! screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnAlternativeTextRadioButton() {
        try {
            await this.waitForElementDisplayed(this.accessibilityAlternativeTextRadioButton, appConst.shortTimeout);
            await this.clickOnElement(this.accessibilityAlternativeTextRadioButton);
            return await this.pause(200);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_clicking_on_decorative_radio');
            throw new Error(`Error occurred after clicking on Alternative Text Radio Button! screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnRemoveImageIcon() {
        try {
            await this.waitForElementDisplayed(this.removeContentSelectedOptionIcon, appConst.shortTimeout);
            await this.clickOnElement(this.removeContentSelectedOptionIcon);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_clicking_on_remove_img_icon');
            throw new Error(`Error occurred after clicking on Remove selected option icon! screenshot: ${screenshot} ` + err);
        }
    }

    async isDecorativeImageRadioSelected() {
        await this.waitForDecorativeImageRadioButtonDisplayed();
        return await this.isSelected(this.accessibilityDecorativeImageRadioButton);
    }

    async isAlternativeTextRadioSelected() {
        await this.waitForAlternativeTextRadioButtonDisplayed();
        return await this.isSelected(this.accessibilityAlternativeTextRadioButton);
    }

    async waitForAlternativeTextInputEnabled() {
        await this.waitForElementEnabled(this.accessibilityAlternativeTextInput, appConst.shortTimeout);
    }

    async waitForAlternativeTextInputDisabled() {
        await this.waitForElementDisabled(this.accessibilityAlternativeTextInput, appConst.shortTimeout);
    }

    async waitForAccessibilityFormInvalid() {
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(XPATH.container + XPATH.accessibilityForm, 'class');
            return text.includes('invalid');
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Accessibility Form should be displayed with error"});
    }

    async waitForAccessibilityFormValid() {
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(XPATH.container + XPATH.accessibilityForm, 'class');
            return !text.includes('invalid');
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Accessibility Form should be valid"});
    }

    async getValidationMessageInAccessibilityForm() {
        await this.waitForAccessibilityFormInvalid();
        let locator = XPATH.accessibilityForm + lib.VALIDATION_RECORDING_VIEWER;
        return await this.getText(locator);
    }

    async typeInAlternativeTextInput(text) {
        try {
            await this.waitForAlternativeTextInputEnabled();
            await this.typeTextInInput(this.accessibilityAlternativeTextInput, text);
            return await this.pause(200);
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_clicking_on_decorative_radio');
            throw new Error(`Error occurred after inserting a text in Alternative Text Input! screenshot: ${screenshot} ` + err);
        }
    }

    async getTextInAlternativeTextInput() {
        return await this.getTextInInput(this.accessibilityAlternativeTextInput);
    }

    async typeCaption(text) {
        await this.waitForElementDisplayed(this.captionInput, appConst.mediumTimeout);
        return await this.typeTextInInput(this.captionInput, text);
    }

    async clickOnCustomWidthCheckBox() {
        try {
            let locator = this.customWidthCheckbox + "//label";
            await this.waitForElementDisplayed(this.customWidthCheckbox, appConst.shortTimeout);
            await this.clickOnElement(locator);
            return await this.pause(200);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_clicking_on_custom_width_checkbox');
            throw new Error(`Error when clicking on custom width checkbox! screenshot:${screenshot} ` + err);
        }
    }

    async isCustomWidthCheckBoxSelected() {
        try {
            await this.waitForElementDisplayed(this.customWidthCheckbox, appConst.shortTimeout);
            return await this.isSelected(this.customWidthCheckbox + lib.CHECKBOX_INPUT);
        } catch (err) {
            await this.saveScreenshot('err_custom_width_checkbox');
            throw new Error('Error occurred during checking the custom width checkbox! ' + err);
        }
    }

    waitForCustomWidthCheckBoxDisabled() {
        return this.waitForElementDisabled(this.customWidthCheckbox + lib.CHECKBOX_INPUT, appConst.shortTimeout);
    }

    async waitForUploadButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.uploadButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshotName = await this.saveScreenshotUniqueName('err_upload_btn');
            throw new Error("Insert Image Dialog, upload button is not visible, screenshot: " + screenshotName + "  " + err);
        }
    }

    waitForCustomWidthCheckBoxEnabled() {
        return this.waitForElementEnabled(this.customWidthCheckbox + lib.CHECKBOX_INPUT, appConst.shortTimeout);
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnInsertButton() {
        try {
            await this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout);
            await this.clickOnElement(this.insertButton);
            await this.waitForDialogClosed();
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_insert_image_button');
            throw new Error(`Insert Image Dialog, error occurred after clicking on the Insert button, screenshot:${screenshot}  ` + err);
        }
    }

    async clickOnUpdateButton() {
        try {
            await this.clickOnElement(this.updateButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_click_on_update_image_button');
            await this.clickOnCancelButton();
            throw new Error(`Insert Image Dialog, error occurred after  clicking on the Update button, screenshot:${screenshot}  ` + err);
        }
    }

    async waitForDialogVisible() {
        try {
            await this.waitForElementDisplayed(this.cancelButton, appConst.mediumTimeout)
            await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_insert_image_dialog');
            throw new Error(`Insert Image Dialog should be opened! screenshot: ${screenshot}   ` + err);
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_close');
            await this.clickOnCancelButton();
            throw new Error(`Insert image dialog should be closed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForImageRangeValue() {
        try {
            await this.waitForElementDisplayed(XPATH.imageRangeValue, appConst.mediumTimeout);
            return await this.getText(XPATH.imageRangeValue);
        } catch (err) {
            await this.saveScreenshotUniqueName('err_range');
            throw new Error("Error when getting text in element with image range " + err);
        }
    }

    waitForImageRangeNotVisible() {
        return this.waitForElementNotDisplayed(XPATH.imageRangeValue, appConst.mediumTimeout);
    }

    // Insert a displayName in Options Filter input then click on the filtered option(Flat mode):
    async filterAndSelectImage(imageDisplayName) {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        // parent locator = ImageModalDialog
        await imageSelectorDropdown.selectFilteredImageInFlatMode(imageDisplayName, XPATH.container);
        await this.pause(1000);
    }

    async filterAndSelectImageByPath(path) {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await this.waitForElementDisplayed(this.imageOptionsFilterInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.imageOptionsFilterInput, path);
        await imageSelectorDropdown.clickOnFilteredByDisplayNameItem(path, XPATH.container);
        await this.pause(400);
    }

    waitForStyleSelectorVisible() {
        return this.waitForElementDisplayed(this.imageStyleSelector, appConst.mediumTimeout);
    }

    async getStyleSelectorOptions() {
        let imageStyleSelectorDropdown = new ImageStyleSelectorDropdown();
        return await imageStyleSelectorDropdown.getOptionsName();
    }

    // Click on dropdown handle in Image style selector:
    async clickOnStyleSelectorDropDownHandle() {
        try {
            await this.waitForElementDisplayed(this.styleSelectorDropDownHandle, appConst.mediumTimeout);
            await this.clickOnElement(this.styleSelectorDropDownHandle);
            await this.pause(900);
        } catch (err) {
            await this.saveScreenshot('err_style_selector_drop_down_handle');
            throw new Error('Error occurred during clicking on style drop down handle! ' + err);
        }
    }

    async getSelectedStyleValue() {
        let locator = XPATH.container + XPATH.styleSelector + XPATH.styleSelectedOptionItem;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);

    }

    // Image style selector:
    async doFilterStyleAndClickOnOption(styleOption) {
        let imageStyleSelectorDropdown = new ImageStyleSelectorDropdown();
        try {
            await imageStyleSelectorDropdown.clickOnFilteredStyle(styleOption)
            return await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_option');
            throw new Error(`Insert Image Dialog, Style selector , screenshot: ${screenshot} ` + err);
        }
    }

    waitForAlignRightButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.container + XPATH.alignRightButton);
    }

    waitForAlignLeftButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.container + XPATH.alignLeftButton);
    }

    waitForAlignCenterButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.container + XPATH.alignCenterButton);
    }

    waitForJustifyButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.container + XPATH.justifyButton);
    }

    async selectImageStyle(style) {
        let imageStyleSelectorDropdown = new ImageStyleSelectorDropdown();
        await imageStyleSelectorDropdown.clickOnFilteredStyle(style);
    }

    async clickOnDropdownHandle() {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await imageSelectorDropdown.clickOnDropdownHandle(XPATH.container);
        await this.pause(1000);
    }

    async getImagesNameInFlatMode() {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        let images = await imageSelectorDropdown.getOptionsDisplayNameInFlatMode(XPATH.container);
        return images;
    }
}

module.exports = InsertImageDialog;
