const Page = require('../../page');
const {BUTTONS, DROPDOWN} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ImageSelectorDropdown = require('../../components/selectors/image.selector.dropdown');

const XPATH = {
    container: `//div[@role='dialog' and @data-component='HtmlAreaImageDialog']`,
    title: "//h2[text()='Insert Image']",
    divRadioGroup: "//div[@role='radiogroup']",
    divRadioGroupAccessibility: "//div[@role='radiogroup' and child::label[text()='Accessibility']]",
    imageSelector: "//div[@data-component='ImageSelector']",
    alignJustifyButton: "//button[@aria-label='Justify']",
    alignLeftButton: "//button[@aria-label='Left']",
    alignCenterButton: "//button[@aria-label='Center']",
    alignRightButton: "//button[@@aria-label='Right']",
    customWidthDiv: "//div[child::label[text()='Custom width']]",
    imageRangeValue: "//input[@type='range']/following-sibling::span",
    accessibilityRadioGroup: "//div[@role='radiogroup']",
    altTextInput: "//input[@placeholder='Describe image content']",
};

class InsertImageDialog extends Page {

    get dialogTitle() {
        return XPATH.container + XPATH.title;
    }

    get paragraphCenterButton() {
        return XPATH.container + XPATH.divRadioGroup + XPATH.alignCenterButton;
    }

    get paragraphLeftButton() {
        return XPATH.container + XPATH.divRadioGroup + XPATH.alignLeftButton;
    }

    get paragraphJustifyButton() {
        return XPATH.container + XPATH.divRadioGroup + XPATH.alignJustifyButton;
    }

    get accessibilityDecorativeImageRadioButton() {
        return XPATH.container + XPATH.divRadioGroupAccessibility + "//button[@role='radio' and contains(@id,'decorative')]";
    }

    get accessibilityAlternativeTextRadioButton() {
        return XPATH.container + XPATH.divRadioGroupAccessibility + "//button[@role='radio' and contains(@id,'informative')]";
    }

    get accessibilityAlternativeTextInput() {
        return XPATH.container + XPATH.altTextInput;
    }

    get imageOptionsFilterInput() {
        return XPATH.container + XPATH.imageSelector + "//input";
    }

    get captionInput() {
        return XPATH.container + "//div[child::label[contains(.,'Caption')]]/following-sibling::div";
    }

    get customWidthCheckbox() {
        return XPATH.container + XPATH.customWidthDiv + "//input[@type='checkbox']";
    }

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    get insertButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Insert');
    }

    get updateButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Update');
    }

    get removeImageButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Remove image');
    }

    async waitForAlternativeTextRadioButtonDisplayed() {
        return await this.waitForElementDisplayed(this.accessibilityAlternativeTextRadioButton, appConst.shortTimeout);
    }

    async waitForDecorativeImageRadioButtonDisplayed() {
        let el = await this.findElement(this.accessibilityAlternativeTextRadioButton);
        await el.moveTo();
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
        let attr = await this.getAttribute(this.accessibilityDecorativeImageRadioButton, 'aria-checked');
        return attr === 'true';
    }

    async waitForAlternativeTextInputDisabled() {
        try {
            return await this.waitForElementDisabled(this.accessibilityAlternativeTextInput);
        } catch (err) {
            await this.handleError(`Insert Image Dialog, alternative text input should be disabled`, 'err_alt_text_input_disabled', err);
        }
    }

    async waitForAlternativeTextInputEnabled() {
        try {
            return await this.waitForElementEnabled(this.accessibilityAlternativeTextInput);
        } catch (err) {
            await this.handleError(`Insert Image Dialog, alternative text input should be enabled`, 'err_alt_text_input_disabled', err);
        }
    }

    async isAlternativeTextRadioSelected() {
        await this.waitForAlternativeTextRadioButtonDisplayed();
        let attr = await this.getAttribute(this.accessibilityAlternativeTextRadioButton, 'aria-checked');
        return attr === 'true';
    }

    async waitForAlternativeTextInputDisplayed() {
        await this.waitForElementEnabled(this.accessibilityAlternativeTextInput, appConst.shortTimeout);
    }

    async waitForAlternativeTextInputNotDisplayed() {
        await this.waitForElementNotDisplayed(this.accessibilityAlternativeTextInput, appConst.shortTimeout);
    }

    async typeInAlternativeTextInput(text) {
        try {
            await this.waitForAlternativeTextInputDisplayed();
            await this.typeTextInInput(this.accessibilityAlternativeTextInput, text);
            return await this.pause(200);
        } catch (err) {
            await this.handleError(`Insert Image Dialog, alternative text input`, 'err_typing_in_alt_text_input', err);
        }
    }

    async getTextInAlternativeTextInput() {
        return await this.getTextInInput(this.accessibilityAlternativeTextInput);
    }

    async typeCaption(text) {
        await this.waitForElementDisplayed(this.captionInput);
        return await this.typeTextInInput(this.captionInput + "//input", text);
    }

    async clickOnCustomWidthCheckBox() {
        try {
            await this.waitForElementDisplayed(XPATH.customWidthDiv, appConst.shortTimeout);
            await this.clickOnElement(this.customWidthCheckbox);
            return await this.pause(200);
        } catch (err) {
            await this.handleError(`Insert Image Dialog`, 'err_clicking_on_custom_width_checkbox', err);
        }
    }

    async isCustomWidthCheckBoxSelected() {
        try {
            await this.waitForElementDisplayed(XPATH.customWidthDiv, appConst.shortTimeout);
            let attr = await this.getAttribute(this.customWidthCheckbox, 'aria-checked');
            return attr === 'true';
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

    async clickOnCloseButton() {
        return await this.clickOnElement(this.closeButton);
    }

    async waitForUploadButtonDisplayed() {
        let imageSelector = new ImageSelectorDropdown(XPATH.container);
        return await imageSelector.waitForUploadButtonDisplayed();
    }

    async waitForInsertButtonEnabled() {
        return await this.waitForElementEnabled(this.insertButton, appConst.shortTimeout);
    }

    async waitForInsertButtonDisabled() {
        return await this.waitForElementDisabled(this.insertButton, appConst.shortTimeout);
    }

    async clickOnInsertButton() {
        try {
            await this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout);
            await this.waitForInsertButtonEnabled();
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
            await this.waitForElementDisplayed(this.dialogTitle);
            await this.pause(300);
        } catch (err) {
            await this.handleError(`Insert Image Dialog should be opened`, 'err_insert_image_dialog', err);
        }
    }

    async waitForDialogClosed() {
        try {
            return await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
        } catch (err) {
            await this.clickOnCloseButton();
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
            await this.waitForElementDisplayed(this.imageOptionsFilterInput);
            await this.typeTextInInput(this.imageOptionsFilterInput, imageDisplayName);
            await this.pause(1000);
            // Click on the filtered item in the dropdown
            let itemLocator = DROPDOWN.COMBOBOX_POPUP + DROPDOWN.imageItemView(imageDisplayName);//`//div[@data-component='ImageSelectorItemView' and descendant::span[contains(text(),'${imageDisplayName}')]]`;
            await this.waitForElementDisplayed(itemLocator);
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
            let itemLocator = XPATH.container +
                              `//div[@data-component='ImageSelectorItemView' and descendant::*[contains(text(),'${path}')]]`;
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
