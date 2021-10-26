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
    collapseButtonTop: "//div[contains(@class,'top-button-row')]//a[contains(@class,'collapse-button') and (text()='Collapse' or text()='Collapse all')]",
    collapseButtonBottom: "//div[contains(@class,'bottom-button-row')]//a[contains(@class,'collapse-button') and  (text()='Collapse' or text()='Collapse all')]",
    expandButton: "//div[@class='bottom-button-row']//a[contains(@class,'collapse-button') and text()='Expand']",
    parameterOccurrenceMenuButton: "//div[contains(@id,'FormItemSetOccurrenceView')]" + "//button[contains(@id,'MoreButton')]",
};

class ShortcutForm extends Page {

    get targetOptionsFilterInput() {
        return xpath.stepForm + lib.FORM_VIEW + lib.CONTENT_SELECTOR + lib.COMBO_BOX_OPTION_FILTER_INPUT;
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

    waitForAddParametersButtonVisible() {
        return this.waitForElementDisplayed(this.addParametersButton, appConst.mediumTimeout);
    }

    waitForCollapseBottomLinkVisible() {
        return this.waitForElementDisplayed(xpath.stepForm + xpath.collapseButtonBottom, appConst.shortTimeout).catch(err => {
            this.saveScreenshot("err_shortcut_collapse_link");
            throw new Error("shortcut - collapse link is not visible " + err);
        })
    }

    waitForCollapseTopLinkVisible() {
        return this.waitForElementDisplayed(xpath.stepForm + xpath.collapseButtonTop, appConst.shortTimeout).catch(err => {
            this.saveScreenshot("err_shortcut_collapse_link");
            throw new Error("shortcut - collapse link is not visible " + err);
        })
    }

    async waitForExpandLinkVisible() {
        try {
            return await this.waitForElementDisplayed(xpath.stepForm + xpath.expandButton, appConst.shortTimeout);
        } catch (err) {
            this.saveScreenshot("err_shortcut_expand_link");
            throw new Error("shortcut - Expand link is not visible " + err);
        }
    }

    clickOnCollapseBottomLink() {
        return this.clickOnElement(xpath.stepForm + xpath.collapseButtonBottom).catch(err => {
            throw  new Error("Error when click on `collapse` link! " + err);
        })
    }

    clickOnCollapseTopLink() {
        return this.clickOnElement(xpath.stepForm + xpath.collapseButtonTop).catch(err => {
            throw  new Error("Error when click on `collapse` link! " + err);
        })
    }

    clickOnRemoveParameterButton() {
        return this.clickOnElement(xpath.stepForm + xpath.parametersFormOccurrence + lib.REMOVE_BUTTON).catch(err => {
            throw  new Error("Error when click on `Remove` button! " + err);
        })
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
            throw  new Error("Error when click on `Expand` link! " + err);
        })
    }

    async clickOnAddParametersButton() {
        try {
            await this.waitForAddParametersButtonVisible();
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
}

module.exports = ShortcutForm;
