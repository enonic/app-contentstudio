/**
 * Created on 02.12.2017.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const loaderComboBox = require('../components/loader.combobox');

const xpath = {
    stepForm: `//div[contains(@id,'ContentWizardStepForm')]`,
    parametersFormOccurrence: `//div[contains(@id,'FormItemSetOccurrenceView')]`,
    parameterNameInput: `//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Name']]//input`,
    parameterValueInput: `//div[contains(@id,'InputView') and descendant::div[@class='label' and text()='Value']]//input`,
    addParametersButton: `//button/span[text()='Add Parameters']`,
    collapseButton: `//a[contains(@class,'collapse-button') and text()='Collapse']`,
    expandButton: `//a[contains(@class,'collapse-button') and text()='Expand']`,
};

const shortcutForm = Object.create(page, {

    targetOptionsFilterInput: {
        get: function () {
            return `${elements.FORM_VIEW}` + `${elements.CONTENT_SELECTOR}` + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },
    addParametersButton: {
        get: function () {
            return xpath.stepForm + xpath.addParametersButton;
        }
    },
    waitForParametersFormVisible: {
        value: function () {
            return this.waitForVisible(xpath.parametersFormOccurrence, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot("err_shortcut_parameters_form");
                throw new Error("shortcut - parameters form should be visible " + err);
            })
        }
    },
    waitForParametersFormNotVisible: {
        value: function () {
            return this.waitForNotVisible(xpath.parametersFormOccurrence, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot("err_shortcut_parameters_form");
                throw new Error("shortcut - parameters form should not be visible " + err);
            })
        }
    },
    typeParameterName: {
        value: function (text) {
            return this.typeTextInInput(xpath.parameterNameInput, text);
        }
    },
    typeParameterValue: {
        value: function (text) {
            return this.typeTextInInput(xpath.parameterValueInput, text);
        }
    },
    getParameterName: {
        value: function () {
            return this.getTextFromInput(xpath.parameterNameInput).catch(err => {
                this.saveScreenshot("err_shortcut_get_parameter_name");
                throw new Error("shortcut - getting the parameter's name " + err);
            });
        }
    },
    getParameterValue: {
        value: function () {
            return this.getTextFromInput(xpath.parameterValueInput).catch(err => {
                this.saveScreenshot("err_shortcut_get_parameter_value");
                throw new Error("shortcut - getting the parameter's value " + err);
            });
        }
    },


    waitForAddParametersButtonVisible: {
        value: function () {
            return this.waitForVisible(this.addParametersButton, appConst.TIMEOUT_2).catch(err => {
                return false;
            })
        }
    },
    waitForCollapseLinkVisible: {
        value: function () {
            return this.waitForVisible(xpath.stepForm + xpath.collapseButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot("err_shortcut_collapse_link");
                throw new Error("shortcut - collapse link is not visible " + err);
            })
        }
    },
    waitForExpandLinkVisible: {
        value: function () {
            return this.waitForVisible(xpath.stepForm + xpath.expandButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot("err_shortcut_collapse_link");
                throw new Error("shortcut - Expand link is not visible " + err);
            })
        }
    },
    clickOnCollapseLink: {
        value: function () {
            return this.doClick(xpath.stepForm + xpath.collapseButton).catch(err => {
                throw  new Error("Error when click on `collapse` link! " + err);
            })
        }
    },
    clickOnRemoveParameterButton: {
        value: function () {
            return this.doClick(xpath.stepForm + xpath.parametersFormOccurrence + elements.REMOVE_BUTTON).catch(err => {
                throw  new Error("Error when click on `Remove` button! " + err);
            })
        }
    },
    clickOnExpandLink: {
        value: function () {
            return this.doClick(xpath.stepForm + xpath.expandButton).catch(err => {
                throw  new Error("Error when click on `Expand` link! " + err);
            })
        }
    },
    clickOnAddParametersButton: {
        value: function () {
            return this.waitForVisible(xpath.addParametersButton, appConst.TIMEOUT_2).catch(err => {
                throw new Error("Add parameters Button is not visible in 2 sec: " + err);
            }).then(() => {
                return this.doClick(xpath.addParametersButton)
            })
        }
    },
    type: {
        value: function (shortcutData) {
            return this.filterOptionsAndSelectTarget(shortcutData.targetDisplayName);
        }
    },
    filterOptionsAndSelectTarget: {
        value: function (displayName) {
            return this.typeTextInInput(this.targetOptionsFilterInput, displayName).then(() => {
                return loaderComboBox.selectOption(displayName);
            });
        }
    },
});
module.exports = shortcutForm;