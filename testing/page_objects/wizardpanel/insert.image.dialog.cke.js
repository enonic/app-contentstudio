const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const comboBox = require('../components/loader.combobox');

const dialog = {
    container: `//div[contains(@id,'ImageModalDialog')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    updateButton: `//button[contains(@id,'DialogButton') and child::span[text()='Update']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    styleSelector: `//div[contains(@id,'ImageStyleSelector')]`,
    styleOptionFilterInput: "//input[contains(@id,'DropdownOptionFilterInput')]",
    customWidthCheckbox: "//div[contains(@class,'custom-width-checkbox')]",
    imageRangeValue: "//div[contains(@class,'custom-width-range-container')]//span[contains(@class,'custom-width-board')]",
    selectedOptionView: "//div[contains(@id,'ImageStyleSelector')]//div[contains(@id,'SelectedOptionView')]"
};

const insertImageDialog = Object.create(page, {


    styleOptionsFilterInput: {
        get: function () {
            return dialog.container + dialog.styleSelector + elements.DROPDOWN_OPTION_FILTER_INPUT;
        }
    },
    imageOptionsFilterInput: {
        get: function () {
            return dialog.container + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },
    styleSelector: {
        get: function () {
            return dialog.container + `${dialog.styleSelector}`;
        }
    },
    customWidthCheckbox: {
        get: function () {
            return dialog.container + `${dialog.customWidthCheckbox}`;
        }
    },
    styleSelectorDropDownHandle: {
        get: function () {
            return dialog.container + dialog.styleSelector + `${elements.DROP_DOWN_HANDLE}`;
        }
    },
    cancelButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.cancelButton}`;
        }
    },
    cancelButtonTop: {
        get: function () {
            return `${dialog.container}` + `${elements.CANCEL_BUTTON_TOP}`;
        }
    },
    insertButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.insertButton}`;
        }
    },
    updateButton: {
        get: function () {
            return `${dialog.container}` + `${dialog.updateButton}`;
        }
    },
    clickOnCustomWidthCheckBox: {
        value: function () {
            return this.waitForVisible(this.customWidthCheckbox, appConst.TIMEOUT_2).then(() => {
                return this.doClick(this.customWidthCheckbox);
            }).catch(err => {
                this.saveScreenshot("err_clicking_on_custom_width_checkbox");
                throw new Error('Error when clicking on custom width checkbox! ' + err);
            }).pause(400);
        }
    },
    isCustomWidthCheckBoxSelected: {
        value: function () {
            return this.waitForVisible(this.customWidthCheckbox, appConst.TIMEOUT_2).then(() => {
                return this.getBrowser().isSelected(this.customWidthCheckbox + elements.CHECKBOX_INPUT);
            }).catch(err => {
                this.saveScreenshot("err_clicking_on_custom_width_checkbox");
                throw new Error('Error when clicking on custom width checkbox! ' + err);
            })
        }
    },
    waitForCustomWidthCheckBoxDisabled: {
        value: function () {
            return this.waitForDisabled(this.customWidthCheckbox + elements.CHECKBOX_INPUT, appConst.TIMEOUT_2);
        }
    },
    waitForCustomWidthCheckBoxEnabled: {
        value: function () {
            return this.waitForEnabled(this.customWidthCheckbox + elements.CHECKBOX_INPUT, appConst.TIMEOUT_2);
        }
    },


    clickOnStyleSelectorDropDownHandle: {
        value: function () {
            return this.doClick(this.styleSelectorDropDownHandle).catch(() => {
                this.saveScreenshot("err_style_selector_drop_down_handle");
                throw new Error('Error when clicking on drop down handle! ' + err);
            })
        }
    },
    doFilterStyleAndClickOnOption: {
        value: function (styleOption) {
            let optionSelector = elements.slickRowByDisplayName(dialog.container, styleOption);
            return this.waitForVisible(this.styleOptionsFilterInput, appConst.TIMEOUT_5).then(() => {
                return this.typeTextInInput(this.styleOptionsFilterInput, styleOption);
            }).then(() => {
                return this.waitForVisible(optionSelector, appConst.TIMEOUT_3);
            }).catch(err => {
                throw new Error('option was not found! ' + styleOption + ' ' + err);
            }).then(() => {
                return this.doClick(optionSelector).catch((err) => {
                    this.saveScreenshot('err_select_option');
                    throw new Error('option not found!' + styleOption);
                }).pause(500);
            });
        }
    },
    clickOnCancelButton: {
        value: function () {
            return this.doClick(this.cancelButton);
        }
    },
    clickOnInsertButton: {
        value: function () {
            return this.doClick(this.insertButton).catch(err => {
                this.saveScreenshot('err_click_on_insert_image_button');
                throw new Error('Insert Image Dialog, error when click on the Insert button  ' + err);
            }).then(() => {
                return this.waitForDialogClosed();
            }).pause(500);
        }
    },

    clickOnUpdateButton: {
        value: function () {
            return this.doClick(this.updateButton).catch(err => {
                this.saveScreenshot('err_click_on_update_image_button');
                throw new Error('Insert Image Dialog, error when click on the Update button  ' + err);
            }).then(() => {
                return this.waitForDialogClosed();
            }).pause(500);
        }
    },
    waitForDialogVisible: {
        value: function () {
            return this.waitForVisible(this.cancelButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_open_insert_image_dialog');
                throw new Error('Insert Image Dialog should be opened!' + err);
            });
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${dialog.container}`, appConst.TIMEOUT_2);
        }
    },
    waitForImageRangeValue: {
        value: function () {
            return this.waitForVisible(`${dialog.imageRangeValue}`, appConst.TIMEOUT_2).then(() => {
                return this.getText(`${dialog.imageRangeValue}`);
            })
        }
    },
    waitForImageRangeNotVisible: {
        value: function () {
            return this.waitForNotVisible(`${dialog.imageRangeValue}`, appConst.TIMEOUT_2);
        }
    },
    filterAndSelectImage: {
        value: function (imageDisplayName) {
            return this.waitForVisible(this.imageOptionsFilterInput, appConst.TIMEOUT_2).then(() => {
                return comboBox.typeTextAndSelectOption(imageDisplayName, dialog.container);
            }).then(() => {
                return this.waitForSpinnerNotVisible(appConst.TIMEOUT_2);
            })
        }
    },
    waitForStyleSelectorVisible: {
        value: function () {
            return this.waitForVisible(this.styleSelector, appConst.TIMEOUT_2);
        }
    },
    getStyleSelectorOptions: {
        value: function () {
            return this.clickOnStyleSelectorDropDownHandle().pause(1000).then(() => {
                let selector = elements.SLICK_ROW + "//div[contains(@id,'ImageStyleNameView')]" + "//h6[contains(@class,'main-name')]";
                return this.getTextFromElements(selector);
            });
        }
    },
    getSelectedStyleName: {
        value: function () {
            let selectedOption = dialog.container + dialog.selectedOptionView + "//h6[contains(@class,'main-name')]";
            return this.getText(selectedOption);
        }
    },

});
module.exports = insertImageDialog;

