/**
 * Created on 02.12.2017.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');
const {COMMON} = require("../../libs/elements");
const xpath = {
    stepForm: `//div[@data-component='ContentWizardTabs']`,
    parametersSet: "//div[@data-component='ItemSetView' and child::div[@data-component='SetHeader']//span[text()='Parameters']]",
    parametersFormOccurrence: "//div[@data-component='ItemSetOccurrenceView']",
    parameterNameInput: "//div[@data-component='ItemSetOccurrenceView']" + COMMON.INPUTS.inputFieldByLabel('Name') + "//input",
    parameterValueInput: "//div[@data-component='ItemSetOccurrenceView']" + COMMON.INPUTS.inputFieldByLabel('Value') + "//input",
    addParametersButton: "//button[@data-component='Button' and @aria-label='Add']",
    collapseAllButton: "//div[@data-component='SetHeader']//button[@data-component='InlineButton' and text()='Collapse all']",
    expandAllButton: "//div[@data-component='SetHeader']//button[@data-component='InlineButton' and text()='Expand all']",
    parameterOccurrenceMenuButton: "//div[@data-component='ItemSetOccurrenceView']//button[@aria-label='More actions']",
    contextMenuItem: text => `//div[@data-component='ContextMenu.Content']//div[@data-component='ContextMenu.Item' and child::span[text()='${text}']]`,
    parametersOccurrenceHeader: "//div[@data-component='ItemSetOccurrenceView']//button[@aria-expanded]",
    removeSelectedTargetIcon:"//div[@data-component='SelectorSelectionItem']//button[@aria-label='Remove']",
    editSelectedTargetIcon:"//div[@data-component='SelectorSelectionItem']//button[@aria-label='Edit']"
};

class ShortcutForm extends Page {

    get addParametersButton() {
        return xpath.stepForm + xpath.parametersSet + xpath.addParametersButton;
    }

    get formValidationRecording() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    get targetValidationRecording() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    get helpTextInParametersForm() {
        return xpath.stepForm + xpath.parametersSet + "//div[@data-component='SetHeader']//span[contains(@class,'text-subtle')]";
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

    async waitForCollapseAllButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(xpath.stepForm + xpath.parametersSet + xpath.collapseAllButton, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Collapse all button should be visible', 'err_shortcut_collapse_all_btn', err);
        }
    }

    async waitForExpandAllButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(xpath.stepForm + xpath.parametersSet + xpath.expandAllButton, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Expand all button should be visible', 'err_shortcut_expand_all_btn', err);
        }
    }

    async clickOnCollapseAllButton() {
        try {
            await this.waitForCollapseAllButtonDisplayed();
            return await this.clickOnElement(xpath.stepForm + xpath.parametersSet + xpath.collapseAllButton);
        } catch (err) {
            await this.handleError('Error when click on Collapse all button!', 'err_shortcut_collapse_all_btn', err);
        }
    }

    clickOnRemoveParameterButton() {
        return this.clickOnElement(xpath.stepForm + xpath.parametersFormOccurrence + "//button[@aria-label='Remove']").catch(err => {
            throw new Error("Error when click on `Remove` button! " + err);
        })
    }

    // Click to expand/collapse a parameter occurrence by index:
    async clickOnParametersForm(index) {
        let locator = xpath.parametersOccurrenceHeader;
        let result = await this.findElements(locator);
        await result[index].click();
        return await this.pause(300);
    }

    async expandParameterMenuAndClickOnDelete(index) {
        let menuButtons = await this.findElements(xpath.parameterOccurrenceMenuButton);
        await menuButtons[index].click();
        await this.pause(400);
        let res = await this.getDisplayedElements(xpath.contextMenuItem('Delete'));
        await res[0].waitForEnabled(
            {timeout: appConst.shortTimeout, timeoutMsg: "Shortcut Parameters - Delete menu item should be enabled!"});
        await res[0].click();
        return await this.pause(300);
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

    async clickOnRemoveTargetIcon() {
        try {
            let locator = xpath.stepForm + xpath.removeSelectedTargetIcon;
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(200);
        }catch (err) {
            await this.handleError('Click on remove target icon', 'err_click_on_remove_target_icon', err);
        }
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
