/**
 * Created on 15.10.2021
 */
const Page = require('../page');
const {COMMON} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ComboBoxListInput = require('../components/selectors/combobox.list.input');

const XPATH = {
    container: "//div[contains(@id,'ComboBox')]",
    comboBoxListInputDiv: "//div[contains(@class,'combobox-list-input')]",
    comboboxUL: "//ul[contains(@id,'ComboBoxList')]",
    inputViewValidationDiv: "//div[contains(@id,'InputViewValidationViewer')]",
    comboBoxSelectedOptionViewDiv: "//div[contains(@id,'ComboBoxSelectedOptionView')]"
};

class ComboBoxFormPanel extends Page {

    get formValidationRecording() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    async selectFilteredOption(option) {
        let comboBoxListInput = new ComboBoxListInput();
        await comboBoxListInput.selectFilteredOption(option);
    }

    // Multiselect combo box has 'Apply' button in the dropdown, so after clicking on the option, we need to click on 'Apply' button to apply the selection.
    async selectFilteredOptionAndApply(option) {
        let comboBoxListInput = new ComboBoxListInput();
        await comboBoxListInput.selectFilteredOptionAndClickOnApply(option);
    }

    async clickOnRemoveSelectedOptionButton(option) {
        let comboBoxListInput = new ComboBoxListInput(COMMON.CONTENT_WIZARD_DATA_COMPONENT);
        await comboBoxListInput.clickOnRemoveSelectedOptionButton(option);
    }

    async waitForOptionFilterInputDisplayed() {
        let comboBoxListInput = new ComboBoxListInput(COMMON.CONTENT_WIZARD_DATA_COMPONENT);
        return await  comboBoxListInput.waitForOptionFilterInputDisplayed();
    }

    async waitForOptionFilterInputNotDisplayed() {
        let comboBoxListInput = new ComboBoxListInput(COMMON.CONTENT_WIZARD_DATA_COMPONENT);
        return await  comboBoxListInput.waitForOptionFilterInputNotDisplayed();
    }

    async getComboBoxValidationMessage() {
        try {
            return this.getTextInDisplayedElements(this.formValidationRecording);
        } catch (err) {
            await this.handleError('ComboBoxFormPanel - getComboBoxValidationMessage:', 'err_get_combobox_validation_message', err);
        }
    }

    async waitForFormValidationRecordingDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.formValidationRecording);
            return elements.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Form Validation recording should be displayed'});
    }


    async getSelectedOptionValues() {
        try {
            let comboBoxListInput = new ComboBoxListInput(COMMON.CONTENT_WIZARD_DATA_COMPONENT);
            return await comboBoxListInput.getSelectedOptionsDisplayName();
        } catch (err) {
            await this.handleError('ComboBoxFormPanel - getSelectedOptionValues:', 'err_get_selected_option_values', err);
        }
    }

}

module.exports = ComboBoxFormPanel;
