const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ImageSelectorDropdown = require('../../components/image.selector.dropdown');

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
    styleOptionFilterInput: "//input[contains(@id,'DropdownOptionFilterInput')]",
    customWidthCheckbox: "//div[contains(@class,'custom-width-checkbox')]",
    imageRangeValue: "//div[contains(@class,'custom-width-range-container')]//span[contains(@class,'custom-width-board')]",
    selectedOptionView: "//div[contains(@id,'ImageStyleSelector')]//div[contains(@id,'SelectedOptionView')]",
    captionInput: "//div[contains(@id,'FormItem') and contains(@class,'caption')]//input",
    defaultActionByName: name => `//button[contains(@id, 'ActionButton') and child::span[contains(.,'${name}')]]`,
    accessibilityForm: "//div[contains(@class,'input-view image-accessibility')]",
    contentSelectedOptionDiv: "//div[contains(@id,'ContentSelectedOptionView')]",
};

class InsertImageDialog extends Page {

    get removeContentSelectedOptionIcon() {
        return XPATH.container + XPATH.contentSelectedOptionDiv + lib.REMOVE_ICON;
    }

    get editContentSelectedOptionIcon() {
        return XPATH.container + XPATH.contentSelectedOptionDiv + lib.EDIT_ICON;
    }

    get styleOptionsFilterInput() {
        return XPATH.container + XPATH.styleSelector + lib.DROPDOWN_OPTION_FILTER_INPUT;
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

    get styleSelector() {
        return XPATH.container + XPATH.styleSelector;
    }

    get captionInput() {
        return XPATH.container + XPATH.captionInput;
    }

    get customWidthCheckbox() {
        return XPATH.container + XPATH.customWidthCheckbox;
    }

    get styleSelectorDropDownHandle() {
        return XPATH.container + XPATH.styleSelector + lib.DROP_DOWN_HANDLE;
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

    async waitForAlternativeTextRadioButtonDisplayed() {
        return await this.waitForElementDisplayed(this.accessibilityAlternativeTextRadioButton, appConst.shortTimeout);
    }

    async waitForDecorativeImageRadioButtonDisplayed() {
        return await this.waitForElementDisplayed(this.accessibilityDecorativeImageRadioButton, appConst.shortTimeout);
    }

    async clickOnDecorativeImageRadioButton() {
        try {
            await this.waitForDecorativeImageRadioButtonDisplayed();
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
            await this.waitForElementDisplayed(this.customWidthCheckbox, appConst.shortTimeout);
            await this.clickOnElement(this.customWidthCheckbox);
            return await this.pause(200);
        } catch (err) {
            await this.saveScreenshotUniqueName("err_clicking_on_custom_width_checkbox");
            throw new Error('Error when clicking on custom width checkbox! ' + err);
        }
    }

    isCustomWidthCheckBoxSelected() {
        return this.waitForElementDisplayed(this.customWidthCheckbox, appConst.shortTimeout).then(() => {
            return this.isSelected(this.customWidthCheckbox + lib.CHECKBOX_INPUT);
        }).catch(err => {
            this.saveScreenshot("err_clicking_on_custom_width_checkbox");
            throw new Error('Error when clicking on custom width checkbox! ' + err);
        })
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

    // Click on dropdown handle in Image style selector:
    clickOnStyleSelectorDropDownHandle() {
        return this.clickOnElement(this.styleSelectorDropDownHandle).catch(err => {
            this.saveScreenshot("err_style_selector_drop_down_handle");
            throw new Error('Error when clicking on drop down handle! ' + err);
        })
    }

    // Image style selector:
    async doFilterStyleAndClickOnOption(styleOption) {
        let optionSelector = lib.slickRowByDisplayName(XPATH.container, styleOption);
        try {
            await this.waitForElementDisplayed(this.styleOptionsFilterInput, appConst.longTimeout);
            await this.typeTextInInput(this.styleOptionsFilterInput, styleOption);
            await this.waitForElementDisplayed(optionSelector, appConst.mediumTimeout);
            await this.clickOnElement(optionSelector);
            return await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_select_option');
            throw new Error(`Insert Image Dialog, Style selector , screenshot: ${screenshot} ` + err);
        }
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
            throw new Error('Insert Image Dialog, error when click on the Insert button, screenshot:  ' + screenshot + '  ' + err);
        }
    }

    clickOnUpdateButton() {
        return this.clickOnElement(this.updateButton).catch(err => {
            this.saveScreenshot('err_click_on_update_image_button');
            throw new Error('Insert Image Dialog, error when click on the Update button  ' + err);
        }).then(() => {
            return this.waitForDialogClosed();
        }).then(() => {
            return this.pause(500);
        });
    }

    async waitForDialogVisible() {
        try {
            return await this.waitForElementDisplayed(this.cancelButton, appConst.mediumTimeout)
        } catch (err) {
            await this.saveScreenshotUniqueName('err_insert_image_dialog');
            throw new Error('Insert Image Dialog should be opened!' + err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }

    async waitForImageRangeValue() {
        try {
            await this.waitForElementDisplayed(XPATH.imageRangeValue, appConst.mediumTimeout);
            return await this.getText(XPATH.imageRangeValue);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_range'));
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
        return await this.waitForSpinnerNotVisible(appConst.mediumTimeout);
    }

    async filterAndSelectImageByPath(path) {
        let imageSelectorDropdown = new ImageSelectorDropdown();
        await this.waitForElementDisplayed(this.imageOptionsFilterInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.imageOptionsFilterInput, path);
        await imageSelectorDropdown.clickOnFilteredItemAndClickOnOk(path, XPATH.container);
        return await this.waitForSpinnerNotVisible(appConst.mediumTimeout);
    }

    waitForStyleSelectorVisible() {
        return this.waitForElementDisplayed(this.styleSelector, appConst.mediumTimeout);
    }

    async getStyleSelectorOptions() {
        await this.clickOnStyleSelectorDropDownHandle();
        await this.pause(1000);
        let selector = lib.SLICK_ROW + "//div[contains(@id,'ImageStyleNameView')]" + "//h6[contains(@class,'main-name')]";
        return await this.getTextInElements(selector);
    }

    getSelectedStyleName() {
        let selectedOption = XPATH.container + XPATH.selectedOptionView + "//h6[contains(@class,'main-name')]";
        return this.getText(selectedOption);
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
}

module.exports = InsertImageDialog;
