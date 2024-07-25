/**
 * Created on 02.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');
const xpath = {
    stepForm: `//div[contains(@id,'ContentWizardStepForm')]`,
    parametersSet: "//div[contains(@id,'FormItemSetView') and descendant::h5[contains(.,'Parameters')]]",
    targetFormView: `//div[contains(@id,'FormView') and descendant::div[text()='Target']]`,
    parametersFormOccurrence: `//div[contains(@id,'FormItemSetOccurrenceView')]`,
    parameterNameInput: `//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Name']]//input`,
    parameterValueInput: `//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Value']]//input`,
    addParametersButton: "//button[contains(@id,'Button') and child::span[contains(.,'Add')]]",
    expandButton: "//div[@class='bottom-button-row']//a[contains(@class,'collapse-button') and text()='Expand']",
    parameterOccurrenceMenuButton: "//div[contains(@id,'FormItemSetOccurrenceView')]" + "//button[contains(@id,'MoreButton')]",
    parametersOccurrenceLabel: "//div[contains(@id,'FormOccurrenceDraggableLabel')]",
};

class ShortcutForm extends Page {

    get targetOptionsFilterInput() {
        return xpath.stepForm + lib.FORM_VIEW + lib.CONTENT_SELECTOR.DIV + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get addNewContentButton() {
        return xpath.stepForm + lib.CONTENT_SELECTOR.DIV + lib.ADD_NEW_CONTENT_BUTTON;
    }

    get removeTargetIcon() {
        return xpath.stepForm + lib.CONTENT_SELECTED_OPTION_VIEW + lib.REMOVE_ICON;
    }

    get addParametersButton() {
        return xpath.stepForm + xpath.parametersSet + "/div[@class='bottom-button-row']" + xpath.addParametersButton;
    }

    get formValidationRecording() {
        return lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
    }

    get targetValidationRecording() {
        return xpath.targetFormView + lib.INPUT_VALIDATION_VIEW;
    }

    get helpTextInParametersForm() {
        return lib.CONTENT_WIZARD_STEP_FORM +
               "//div[contains(@id,'FormItemSetView') and descendant::h5[text()='Parameters']]//div[contains(@class,'help-text')]/p";
    }

    async waitForAddNewContentButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.addNewContentButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_add_new_btn');
            throw new Error('Add new button is not displayed, screenshot:' + screenshot + ' ' + err);
        }
    }

    async waitForAddNewContentButtonNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.addNewContentButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_add_new_btn');
            throw new Error('Add new button should not be displayed, screenshot:' + screenshot + ' ' + err);
        }
    }

    async clickOnAddNewContentButton() {
        await this.waitForAddNewContentButtonDisplayed();
        return await this.clickOnElement(this.addNewContentButton);
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

    getParameterName() {
        return this.getTextInInput(xpath.parameterNameInput).catch(err => {
            this.saveScreenshot("err_shortcut_get_parameter_name");
            throw new Error("shortcut - getting the parameter's name " + err);
        });
    }

    getParameterValue() {
        return this.getTextInInput(xpath.parameterValueInput).catch(err => {
            this.saveScreenshot("err_shortcut_get_parameter_value");
            throw new Error("shortcut - getting the parameter's value " + err);
        });
    }

    waitForAddParametersButtonDisplayed() {
        return this.waitForElementDisplayed(this.addParametersButton, appConst.mediumTimeout);
    }

    waitForCollapseBottomLinkVisible() {
        return this.waitForElementDisplayed(xpath.stepForm + lib.BUTTONS.COLLAPSE_BUTTON_BOTTOM, appConst.shortTimeout).catch(err => {
            this.saveScreenshot("err_shortcut_collapse_link");
            throw new Error("shortcut - collapse link is not visible " + err);
        })
    }

    async waitForCollapseTopLinkVisible() {
        try {
            return await this.waitForElementDisplayed(xpath.stepForm + lib.BUTTONS.COLLAPSE_BUTTON_TOP, appConst.shortTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName("err_shortcut_collapse_link");
            throw new Error(`shortcut - collapse link is not visible, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForExpandLinkVisible() {
        try {
            return await this.waitForElementDisplayed(xpath.stepForm + xpath.expandButton, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName("err_shortcut_expand_link");
            throw new Error(`shortcut - Expand link is not visible, screenshot: ${screenshot} ` + err);
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
            await this.saveScreenshot(appConst.generateRandomName("err_short"));
            throw new Error(err);
        }
    }

    type(shortcutData) {
        return this.filterOptionsAndSelectTarget(shortcutData.targetDisplayName);
    }

    async filterOptionsAndSelectTarget(displayName) {
        let loaderComboBox = new LoaderComboBox();
        await this.typeTextInInput(this.targetOptionsFilterInput, displayName);
        return await loaderComboBox.selectOption(displayName);
    }

    async getSelectedTargetDisplayName() {
        let locator = xpath.stepForm + lib.CONTENT_SELECTED_OPTION_VIEW + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async clickOnRemoveTargetIcon() {
        await this.waitForElementDisplayed(this.removeTargetIcon, appConst.mediumTimeout);
        await this.clickOnElement(this.removeTargetIcon);
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
