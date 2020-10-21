/**
 * Created on 02.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');
const xpath = {
    stepForm: `//div[contains(@id,'ContentWizardStepForm')]`,
    parametersFormOccurrence: `//div[contains(@id,'FormItemSetOccurrenceView')]`,
    parameterNameInput: `//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Name']]//input`,
    parameterValueInput: `//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Value']]//input`,
    addParametersButton: `//button/span[text()='Add Parameters']`,
    collapseButton: `//a[contains(@class,'collapse-button') and text()='Collapse']`,
    expandButton: `//a[contains(@class,'collapse-button') and text()='Expand']`,
};

class ShortcutForm extends Page {

    get targetOptionsFilterInput() {
        return lib.FORM_VIEW + lib.CONTENT_SELECTOR + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get addParametersButton() {
        return xpath.stepForm + xpath.addParametersButton;
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
        return this.waitForElementDisplayed(this.addParametersButton, appConst.shortTimeout).catch(err => {
            return false;
        })
    }

    waitForCollapseLinkVisible() {
        return this.waitForElementDisplayed(xpath.stepForm + xpath.collapseButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot("err_shortcut_collapse_link");
            throw new Error("shortcut - collapse link is not visible " + err);
        })
    }

    waitForExpandLinkVisible() {
        return this.waitForElementDisplayed(xpath.stepForm + xpath.expandButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot("err_shortcut_collapse_link");
            throw new Error("shortcut - Expand link is not visible " + err);
        })
    }

    clickOnCollapseLink() {
        return this.clickOnElement(xpath.stepForm + xpath.collapseButton).catch(err => {
            throw  new Error("Error when click on `collapse` link! " + err);
        })
    }

    clickOnRemoveParameterButton() {
        return this.clickOnElement(xpath.stepForm + xpath.parametersFormOccurrence + lib.REMOVE_BUTTON).catch(err => {
            throw  new Error("Error when click on `Remove` button! " + err);
        })
    }

    clickOnExpandLink() {
        return this.clickOnElement(xpath.stepForm + xpath.expandButton).catch(err => {
            throw  new Error("Error when click on `Expand` link! " + err);
        })
    }

    clickOnAddParametersButton() {
        return this.waitForElementDisplayed(xpath.addParametersButton, appConst.shortTimeout).catch(err => {
            throw new Error("Add parameters Button is not visible in 2 sec: " + err);
        }).then(() => {
            return this.clickOnElement(xpath.addParametersButton)
        })
    }

    type(shortcutData) {
        return this.filterOptionsAndSelectTarget(shortcutData.targetDisplayName);
    }

    filterOptionsAndSelectTarget(displayName) {
        let loaderComboBox = new LoaderComboBox();
        return this.typeTextInInput(this.targetOptionsFilterInput, displayName).then(() => {
            return loaderComboBox.selectOption(displayName);
        });
    }
};
module.exports = ShortcutForm;