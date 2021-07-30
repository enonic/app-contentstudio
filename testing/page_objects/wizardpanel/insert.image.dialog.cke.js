const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ComboBox = require('../components/loader.combobox');

const XPATH = {
    container: `//div[contains(@id,'ImageModalDialog')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    updateButton: `//button[contains(@id,'DialogButton') and child::span[text()='Update']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    styleSelector: `//div[contains(@id,'ImageStyleSelector')]`,
    styleOptionFilterInput: "//input[contains(@id,'DropdownOptionFilterInput')]",
    customWidthCheckbox: "//div[contains(@class,'custom-width-checkbox')]",
    imageRangeValue: "//div[contains(@class,'custom-width-range-container')]//span[contains(@class,'custom-width-board')]",
    selectedOptionView: "//div[contains(@id,'ImageStyleSelector')]//div[contains(@id,'SelectedOptionView')]",
    captionInput: "//div[contains(@id,'FormItem') and contains(@class,'caption')]//input",

    defaultActionByName: name => `//button[contains(@id, 'ActionButton') and child::span[contains(.,'${name}')]]`,
};

class InsertImageDialog extends Page {

    get styleOptionsFilterInput() {
        return XPATH.container + XPATH.styleSelector + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    get imageOptionsFilterInput() {
        return XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
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

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get insertButton() {
        return XPATH.container + XPATH.insertButton;
    }

    get updateButton() {
        return XPATH.container + XPATH.updateButton;
    }

    async typeCaption(text) {
        await this.waitForElementDisplayed(this.captionInput, appConst.mediumTimeout);
        return await this.typeTextInInput(this.captionInput, text);
    }

    clickOnCustomWidthCheckBox() {
        return this.waitForElementDisplayed(this.customWidthCheckbox, appConst.shortTimeout).then(() => {
            return this.clickOnElement(this.customWidthCheckbox);
        }).then(() => {
            return this.pause(400);
        }).catch(err => {
            this.saveScreenshot("err_clicking_on_custom_width_checkbox");
            throw new Error('Error when clicking on custom width checkbox! ' + err);
        });
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

    waitForCustomWidthCheckBoxEnabled() {
        return this.waitForElementEnabled(this.customWidthCheckbox + lib.CHECKBOX_INPUT, appConst.shortTimeout);
    }

    clickOnStyleSelectorDropDownHandle() {
        return this.clickOnElement(this.styleSelectorDropDownHandle).catch(err => {
            this.saveScreenshot("err_style_selector_drop_down_handle");
            throw new Error('Error when clicking on drop down handle! ' + err);
        })
    }

    async doFilterStyleAndClickOnOption(styleOption) {
        let optionSelector = lib.slickRowByDisplayName(XPATH.container, styleOption);
        try {
            await this.waitForElementDisplayed(this.styleOptionsFilterInput, appConst.longTimeout);
            await this.typeTextInInput(this.styleOptionsFilterInput, styleOption);
            await this.waitForElementDisplayed(optionSelector, appConst.mediumTimeout);
            await this.clickOnElement(optionSelector);
            return this.pause(400);
        } catch (err) {
            this.saveScreenshot('err_select_option');
            throw new Error('Insert Image Dialog, Style selector ' + styleOption + ' ' + err);
        }
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnInsertButton() {
        await this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout);
        await this.clickOnElement(this.insertButton);
        await this.waitForDialogClosed();
        return await this.pause(500);
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

    waitForDialogVisible() {
        return this.waitForElementDisplayed(this.cancelButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_open_insert_image_dialog');
            throw new Error('Insert Image Dialog should be opened!' + err);
        });
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }

    async waitForImageRangeValue() {
        try {
            await this.waitForElementDisplayed(XPATH.imageRangeValue, appConst.shortTimeout);
            return await this.getText(XPATH.imageRangeValue);
        } catch (err) {
            throw new Error("Error when getting text in element with image range " + err);
        }
    }

    waitForImageRangeNotVisible() {
        return this.waitForElementNotDisplayed(XPATH.imageRangeValue, appConst.shortTimeout);
    }

    async filterAndSelectImage(imageDisplayName) {
        let comboBox = new ComboBox();
        await this.waitForElementDisplayed(this.imageOptionsFilterInput, appConst.shortTimeout);
        await comboBox.typeTextAndSelectOption(imageDisplayName, XPATH.container);
        return await this.waitForSpinnerNotVisible(appConst.shortTimeout);
    }

    waitForStyleSelectorVisible() {
        return this.waitForElementDisplayed(this.styleSelector, appConst.shortTimeout);
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
}

module.exports = InsertImageDialog;

