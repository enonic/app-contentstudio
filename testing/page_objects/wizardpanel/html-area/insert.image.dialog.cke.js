const Page = require('../../page');
const {BUTTONS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[@role='dialog' and @data-component='HtmlAreaImageDialog']`,
    imageSelector: "//div[@data-component='ImageSelector']",
    alignJustifyButton: "//button[@value='justify']",
    alignLeftButton: "//button[@value='left']",
    alignCenterButton: "//button[@value='center']",
    alignRightButton: "//button[@value='right']",
    customWidthCheckbox: "//button[@role='checkbox']",
    imageRangeValue: "//input[@type='range']/following-sibling::span",
    captionInput: "//input",
    accessibilityRadioGroup: "//div[@role='radiogroup']",
    altTextInput: "//div[@role='radiogroup']/following::input",
};

class InsertImageDialog extends Page {

    get paragraphCenterButton() {
        return XPATH.container + XPATH.alignCenterButton;
    }

    get paragraphLeftButton() {
        return XPATH.container + XPATH.alignLeftButton;
    }

    get paragraphJustifyButton() {
        return XPATH.container + XPATH.alignJustifyButton;
    }

    get accessibilityDecorativeImageRadioButton() {
        return XPATH.container + "//button[@role='radio' and @value='decorative']";
    }

    get accessibilityAlternativeTextRadioButton() {
        return XPATH.container + "//button[@role='radio' and @value='informative']";
    }

    get accessibilityAlternativeTextInput() {
        return XPATH.container + XPATH.altTextInput;
    }

    get imageOptionsFilterInput() {
        return XPATH.container + XPATH.imageSelector + "//input";
    }

    get captionInput() {
        return XPATH.container + "//label[contains(.,'Caption')]/following-sibling::input | " +
            XPATH.container + "//label[contains(.,'Caption')]/..//input";
    }

    get customWidthCheckbox() {
        return XPATH.container + XPATH.customWidthCheckbox;
    }

    get cancelButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Cancel');
    }

    get cancelButtonTop() {
        return XPATH.container + "//button[@aria-label='Close']";
    }

    get insertButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Insert');
    }

    get updateButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Update');
    }

    get removeImageButton() {
        return XPATH.container + "//button[descendant::*[contains(@class,'lucide-x')]]";
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
            await this.handleError(`Insert Image Dialog, decorative radio...`, 'err_clicking_on_decorative_radio', err);
        }
    }

    async clickOnAlternativeTextRadioButton() {
        try {
            await this.waitForElementDisplayed(this.accessibilityAlternativeTextRadioButton, appConst.shortTimeout);
            await this.clickOnElement(this.accessibilityAlternativeTextRadioButton);
            return await this.pause(200);
        } catch (err) {
            await this.handleError(`Insert Image Dialog, alternative text radio...`, 'err_clicking_on_alternative_text_radio', err);
        }
    }

    async clickOnRemoveImageIcon() {
        try {
            await this.waitForElementDisplayed(this.removeImageButton, appConst.shortTimeout);
            await this.clickOnElement(this.removeImageButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Insert Image Dialog, Remove image icon`, 'err_clicking_on_remove_img_icon', err);
        }
    }

    async isDecorativeImageRadioSelected() {
        await this.waitForDecorativeImageRadioButtonDisplayed();
        let attr = await this.getAttribute(this.accessibilityDecorativeImageRadioButton, 'data-state');
        return attr === 'checked';
    }

    async isAlternativeTextRadioSelected() {
        await this.waitForAlternativeTextRadioButtonDisplayed();
        let attr = await this.getAttribute(this.accessibilityAlternativeTextRadioButton, 'data-state');
        return attr === 'checked';
    }

    async waitForAlternativeTextInputEnabled() {
        await this.waitForElementEnabled(this.accessibilityAlternativeTextInput, appConst.shortTimeout);
    }

    async waitForAlternativeTextInputDisabled() {
        await this.waitForElementDisabled(this.accessibilityAlternativeTextInput, appConst.shortTimeout);
    }

    async waitForAccessibilityFormInvalid() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.findElements(XPATH.container + XPATH.accessibilityRadioGroup + "//*[contains(@class,'error')]");
            return elements.length > 0;
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Accessibility Form should be displayed with error"});
    }

    async waitForAccessibilityFormValid() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.findElements(XPATH.container + XPATH.accessibilityRadioGroup + "//*[contains(@class,'error')]");
            return elements.length === 0;
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Accessibility Form should be valid"});
    }

    async getValidationMessageInAccessibilityForm() {
        await this.waitForAccessibilityFormInvalid();
        let locator = XPATH.container + XPATH.accessibilityRadioGroup + "//*[contains(@class,'error')]";
        return await this.getText(locator);
    }

    async typeInAlternativeTextInput(text) {
        try {
            await this.waitForAlternativeTextInputEnabled();
            await this.typeTextInInput(this.accessibilityAlternativeTextInput, text);
            return await this.pause(200);
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_typing_in_alt_text_input');
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
            await this.handleError(`Insert Image Dialog`, 'err_clicking_on_custom_width_checkbox', err);
        }
    }

    async isCustomWidthCheckBoxSelected() {
        try {
            await this.waitForElementDisplayed(this.customWidthCheckbox, appConst.shortTimeout);
            let attr = await this.getAttribute(this.customWidthCheckbox, 'data-state');
            return attr === 'checked';
        } catch (err) {
            await this.handleError(`Insert Image Dialog Custom Width-`, 'err_is_custom_width_checkbox_selected', err);
        }
    }

    waitForCustomWidthCheckBoxDisabled() {
        return this.waitForElementDisabled(this.customWidthCheckbox, appConst.shortTimeout);
    }

    waitForCustomWidthCheckBoxEnabled() {
        return this.waitForElementEnabled(this.customWidthCheckbox, appConst.shortTimeout);
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButtonTop);
    }

    async clickOnInsertButton() {
        try {
            await this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout);
            await this.clickOnElement(this.insertButton);
            await this.waitForDialogClosed();
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Insert Image Dialog`, 'err_click_on_insert_image_button', err);
        }
    }

    async clickOnUpdateButton() {
        try {
            await this.clickOnElement(this.updateButton);
        } catch (err) {
            await this.clickOnCancelButton();
            await this.handleError(`Insert Image Dialog, Update button`, 'err_click_on_update_image_button', err);
        }
    }

    async waitForDialogVisible() {
        try {
            await this.waitForElementDisplayed(this.insertButton);
            await this.pause(300);
        } catch (err) {
            await this.handleError(`Insert Image Dialog should be opened`, 'err_insert_image_dialog', err);
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
        } catch (err) {
            await this.clickOnCancelButton();
            await this.handleError(`Insert image dialog should be closed`, 'err_close_insert_image_dialog', err);
        }
    }

    async waitForImageRangeValue() {
        try {
            await this.waitForElementDisplayed(XPATH.container + XPATH.imageRangeValue, appConst.mediumTimeout);
            return await this.getText(XPATH.container + XPATH.imageRangeValue);
        } catch (err) {
            await this.handleError(`Insert Image Dialog`, 'err_wait_for_image_range_value', err);
        }
    }

    waitForImageRangeNotVisible() {
        return this.waitForElementNotDisplayed(XPATH.container + XPATH.imageRangeValue, appConst.mediumTimeout);
    }

    // Type a displayName in the image selector filter input then click on the filtered option:
    async filterAndSelectImage(imageDisplayName) {
        try {
            await this.waitForElementDisplayed(this.imageOptionsFilterInput, appConst.mediumTimeout);
            await this.typeTextInInput(this.imageOptionsFilterInput, imageDisplayName);
            await this.pause(1000);
            // Click on the filtered item in the dropdown
            let itemLocator = XPATH.container + `//div[@data-component='ImageSelectorItemView' and descendant::*[contains(text(),'${imageDisplayName}')]]`;
            await this.waitForElementDisplayed(itemLocator, appConst.mediumTimeout);
            await this.clickOnElement(itemLocator);
            await this.pause(1000);
        } catch (err) {
            await this.handleError(`Insert Image Dialog, filter and select image`, 'err_filter_and_select_image', err);
        }
    }

    async filterAndSelectImageByPath(path) {
        try {
            await this.waitForElementDisplayed(this.imageOptionsFilterInput, appConst.mediumTimeout);
            await this.typeTextInInput(this.imageOptionsFilterInput, path);
            await this.pause(1000);
            let itemLocator = XPATH.container + `//div[@data-component='ImageSelectorItemView' and descendant::*[contains(text(),'${path}')]]`;
            await this.waitForElementDisplayed(itemLocator, appConst.mediumTimeout);
            await this.clickOnElement(itemLocator);
            await this.pause(400);
        } catch (err) {
            await this.handleError(`Insert Image Dialog, filter and select image by path`, 'err_filter_and_select_image_by_path', err);
        }
    }

    waitForStyleSelectorVisible() {
        let locator = XPATH.container + "//button[@role='combobox']";
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    // Click on the style selector trigger:
    async clickOnStyleSelectorDropDownHandle() {
        try {
            let locator = XPATH.container + "//button[@role='combobox']";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            await this.pause(900);
        } catch (err) {
            await this.handleError(`Insert Image Dialog`, 'err_click_on_style_selector_drop_down_handle', err);
        }
    }

    async getSelectedStyleValue() {
        let locator = XPATH.container + "//button[@role='combobox']//span";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    // Select style option from dropdown:
    async doFilterStyleAndClickOnOption(styleOption) {
        try {
            let locator = `//div[@role='option' and descendant::*[contains(text(),'${styleOption}')]]`;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
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
        return this.waitForElementDisplayed(this.paragraphCenterButton);
    }

    waitForJustifyButtonDisplayed() {
        return this.waitForElementDisplayed(this.paragraphJustifyButton);
    }

    async clickOnParagraphCenterButton() {
        try {
            await this.waitForElementDisplayed(this.paragraphCenterButton, appConst.mediumTimeout);
            await this.clickOnElement(this.paragraphCenterButton);
        } catch (err) {
            await this.handleError(`Insert Image Dialog, align center button`, 'err_click_on_paragraph_center_button', err);
        }
    }
}

module.exports = InsertImageDialog;
