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
    collapseButtonTop: "//div[contains(@class,'top-button-row')]//a[contains(@class,'collapse-button') and (text()='Collapse' or text()='Collapse all')]",
    collapseButtonBottom: "//div[contains(@class,'bottom-button-row')]//a[contains(@class,'collapse-button') and  (text()='Collapse' or text()='Collapse all')]",
    expandButton: "//a[contains(@class,'collapse-button') and text()='Expand']",
    parameterOccurrenceMenuButton: "//div[contains(@id,'FormItemSetOccurrenceView')]" + "//button[contains(@id,'MoreButton')]",
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

    waitForExpandLinkVisible() {
        return this.waitForElementDisplayed(xpath.stepForm + xpath.expandButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot("err_shortcut_collapse_link");
            throw new Error("shortcut - Expand link is not visible " + err);
        })
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
        let menuButtons = await this.findElements(locator);
        await menuButtons[index].click();
        await this.pause(400);
        let res = await this.getDisplayedElements(
            "//div[contains(@id,'FormItemSetOccurrenceView')]" + "//li[contains(@id,'MenuItem') and text()='Delete']");
        await res[0].waitForEnabled(appConst.shortTimeout, "Shortcut Parameters - Delete menu item should be enabled!");
        await res[0].click();
        return await this.pause(300);
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
}

module.exports = ShortcutForm;
