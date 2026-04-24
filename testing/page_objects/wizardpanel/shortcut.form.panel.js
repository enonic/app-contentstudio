/**
 * Created on 02.12.2017.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');
const {COMMON} = require("../../libs/elements");
const xpath = {
    stepForm: `//div[@data-component='ContentWizardTabs']`,
    parametersSet: "//div[contains(@id,'FormItemSetView') and descendant::h5[contains(.,'Parameters')]]",
    targetFormView: `//div[contains(@id,'FormView') and descendant::div[text()='Target']]`,
    parametersFormOccurrence: `//div[contains(@id,'FormItemSetOccurrenceView')]`,
    parameterNameInput: `//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Name']]//input`,
    parameterValueInput: `//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Value']]//input`,
    addParametersButton: "//button[contains(@id,'Button') and child::span[contains(.,'Add')]]",
    expandButton: "//div[@class='bottom-button-row']//a[contains(@class,'collapse-button') and text()='Expand']",
    parameterOccurrenceMenuButton: "//div[contains(@id,'FormItemSetOccurrenceView')]" ,
    parametersOccurrenceLabel: "//div[contains(@id,'FormOccurrenceDraggableLabel')]",
};

class ShortcutForm extends Page {

    get targetOptionsFilterInput() {
        return xpath.stepForm + lib.FORM_VIEW + lib.CONTENT_SELECTOR.DIV + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    get addParametersButton() {
        return xpath.stepForm + xpath.parametersSet + "/div[@class='bottom-button-row']" + xpath.addParametersButton;
    }

    get formValidationRecording() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    get targetValidationRecording() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    get helpTextInParametersForm() {
        return lib.CONTENT_WIZARD_STEP_FORM +
               "//div[contains(@id,'FormItemSetView') and descendant::h5[text()='Parameters']]//div[contains(@class,'help-text')]/p";
    }

    async waitForAddNewContentButtonDisplayed() {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown(xpath.stepForm);
            await contentSelectorDropdown.waitForAddNewContentButtonDisplayed();
        } catch (err) {
            await this.handleError('Add new button should be displayed', 'err_add_new_btn', err);
        }
    }

    async waitForAddNewContentButtonNotDisplayed() {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown(xpath.stepForm);
            await contentSelectorDropdown.waitForAddNewContentButtonNotDisplayed();
        } catch (err) {
            await this.handleError('Add new button should not be displayed', 'err_add_new_btn', err);
        }
    }

    async clickOnAddNewContentButton() {
        let contentSelectorDropdown = new ContentSelectorDropdown(xpath.stepForm);
        await contentSelectorDropdown.clickOnAddNewContentButton();
    }

    waitForParametersFormVisible() {
        return this.waitForElementDisplayed(xpath.parametersFormOccurrence, appConst.shortTimeout).catch(err => {
            this.saveScreenshot("err_shortcut_parameters_form");
            throw new Error("shortcut - parameters form should be visible " + err);
        })
    }

    waitForParametersFormNotVisible() {
        return this.waitForElementNotDisplayed(xpath.parametersFormOccurrence, appConst.shortTimeout).catch(err => {
            this.saveScreenshot("err_shortcut_parameters_form");
            throw new Error("shortcut - parameters form should not be visible " + err);
        })
    }

    typeParameterName(text) {
        return this.typeTextInInput(xpath.parameterNameInput, text);
    }

    typeParameterValue(text) {
        return this.typeTextInInput(xpath.parameterValueInput, text);
    }

    async getParameterName() {
        try {
            return await this.getTextInInput(xpath.parameterNameInput)
        } catch (err) {
            await this.handleError('Getting parameter name', 'err_shortcut_get_parameter_name', err);
        }
    }

    async getParameterValue() {
        try {
            return await this.getTextInInput(xpath.parameterValueInput)
        } catch (err) {
            await this.handleError('Getting parameter value', 'err_shortcut_get_parameter_value', err);
        }
    }

    waitForAddParametersButtonDisplayed() {
        return this.waitForElementDisplayed(this.addParametersButton, appConst.mediumTimeout);
    }

    async waitForCollapseBottomLinkVisible() {
        try {
            return await this.waitForElementDisplayed(xpath.stepForm + lib.BUTTONS.COLLAPSE_BUTTON_BOTTOM, appConst.shortTimeout)
        } catch (err) {
            await this.handleError('Collapse link should be visible', 'err_shortcut_collapse_link', err);
        }
    }

    async waitForCollapseTopLinkVisible() {
        try {
            return await this.waitForElementDisplayed(xpath.stepForm + lib.BUTTONS.COLLAPSE_BUTTON_TOP, appConst.shortTimeout)
        } catch (err) {
            await this.handleError('Collapse link should be visible', 'err_shortcut_collapse_link', err);
        }
    }

    async waitForExpandLinkVisible() {
        try {
            return await this.waitForElementDisplayed(xpath.stepForm + xpath.expandButton, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Expand link should be visible', 'err_shortcut_expand_link', err);
        }
    }

    clickOnCollapseBottomLink() {
        return this.clickOnElement(xpath.stepForm + lib.BUTTONS.COLLAPSE_BUTTON_BOTTOM).catch(err => {
            throw new Error("Error when click on `collapse` link! " + err);
        })
    }

    clickOnCollapseTopLink() {
        return this.clickOnElement(xpath.stepForm + lib.BUTTONS.COLLAPSE_BUTTON_TOP).catch(err => {
            throw new Error("Error when click on `collapse` link! " + err);
        })
    }

    clickOnRemoveParameterButton() {
        return this.clickOnElement(xpath.stepForm + xpath.parametersFormOccurrence + lib.REMOVE_BUTTON).catch(err => {
            throw new Error("Error when click on `Remove` button! " + err);
        })
    }

    //Click and Expand/Collapse parameters form:
    async clickOnParametersForm(index) {
        let locator = xpath.parametersFormOccurrence + xpath.parametersOccurrenceLabel;
        let result = await this.findElements(locator);
        await result[index].click();
        return await this.pause(300);
    }

    async expandParameterMenuAndClickOnDelete(index) {
        let locator = xpath.parameterOccurrenceMenuButton;
        let deleteMenuItem = "//div[contains(@id,'FormItemSetOccurrenceView')]" + "//li[contains(@id,'MenuItem') and text()='Delete']";
        let menuButtons = await this.findElements(locator);
        await menuButtons[index].click();
        await this.pause(400);
        let res = await this.getDisplayedElements(deleteMenuItem);
        await res[0].waitForEnabled(
            {timeout: appConst.shortTimeout, timeoutMsg: "Shortcut Parameters - Delete menu item should be enabled!"});
        await res[0].click();
        return await this.pause(300);
    }

    clickOnExpandLink() {
        return this.clickOnElement(xpath.stepForm + xpath.expandButton).catch(err => {
            throw new Error("Error when click on `Expand` link! " + err);
        })
    }

    async clickOnAddParametersButton() {
        try {
            await this.waitForAddParametersButtonDisplayed();
            return await this.clickOnElement(this.addParametersButton);
        } catch (err) {
            await this.handleError(`Clicked on 'Add Parameter' button.`, 'err_click_on_add_parameters_button', err);
        }
    }

    type(shortcutData) {
        return this.filterOptionsAndSelectTarget(shortcutData.targetDisplayName);
    }

    async filterOptionsAndSelectTarget(displayName) {
        let contentSelectorDropdown = new ContentSelectorDropdown(xpath.stepForm);
        await contentSelectorDropdown.doFilterItem(displayName);
        await contentSelectorDropdown.clickOnListItemOptionByDisplayName(displayName);
    }

    async getSelectedTargetDisplayName() {
       let contentSelectorDropdown  = new ContentSelectorDropdown(xpath.stepForm);
       return await contentSelectorDropdown.getSelectedOptionsDisplayName();
    }

    async clickOnRemoveTargetIcon(displayName) {
        let contentSelectorDropdown  = new ContentSelectorDropdown(xpath.stepForm);
        await contentSelectorDropdown.removeSelectedOption(displayName);
        return await this.pause(200);
    }

    async getFormValidationRecording() {
        await this.waitForFormValidationRecordingDisplayed();
        let recordingElements = await this.getDisplayedElements(this.targetValidationRecording);
        return await recordingElements[0].getText();
    }

    async waitForFormValidationRecordingDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.targetValidationRecording);
            return elements.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Target Form Validation recording should be displayed"});
    }

    async getHelpTextsInParametersForm() {
        await this.waitForElementDisplayed(this.helpTextInParametersForm, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(this.helpTextInParametersForm);
    }

    waitForHelpTextInParametersFormNotDisplayed() {
        return this.waitForElementNotDisplayed(this.helpTextInParametersForm, appConst.mediumTimeout);
    }
}

module.exports = ShortcutForm;
