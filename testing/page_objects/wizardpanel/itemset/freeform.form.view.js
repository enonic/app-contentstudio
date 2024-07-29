/**
 * Created on 12.04.2019.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');

const xpath = {
    itemSet: "//div[contains(@id,'FormItemSetView')]",
    elementTypeSetView: "//div[contains(@id,'FormOptionSetView') and descendant::h5[text()='element type']]",
    elementTypeDropdown: "//div[contains(@id,'FormOptionSetView') and descendant::h5[text()='element type']]//div[contains(@id,'Dropdown')]",
    inputTypeSetView: "//div[contains(@id,'FormOptionSetOptionView') and descendant::h5[text()='input type']]",
    inputTypeDropdown: "//div[contains(@id,'FormOptionSetOptionView') and descendant::h5[text()='input type']]//div[contains(@id,'Dropdown')]",
};

class FreeFormView extends Page {

    //element type options filter
    get elementTypeOptionFilterInput() {
        return xpath.itemSet + xpath.elementTypeSetView + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    get elementTypeDropDownHandle() {
        return xpath.itemSet + xpath.elementTypeSetView + "//div[contains(@id,'FormOptionSetOccurrenceViewSingleOption')]" +
               "//div[contains(@id,'Dropdown')]" + lib.DROP_DOWN_HANDLE;
    }

    get inputTypeOptionFilterInput() {
        return xpath.itemSet + xpath.inputTypeSetView + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    get inputTypeDropDownHandle() {
        return xpath.itemSet + xpath.inputTypeSetView + "//div[contains(@id,'Dropdown')]" + lib.DROP_DOWN_HANDLE;
    }

    get addButton() {
        return xpath.itemSet + "//button[child::span[text()='Add'] and @title='Add Input']";
    }

    get inputTypeMenuButton() {
        return xpath.itemSet + xpath.inputTypeSetView + lib.BUTTONS.MORE_BUTTON;
    }

    waitForAddButtonDisplayed() {
        return this.waitForElementDisplayed(this.addButton, appConst.mediumTimeout);
    }

    //Types the required text in the option filter input and select an option:
    async selectInputType(inputType) {
        await this.scrollPanel(800);
        await this.pause(300);
        await this.typeTextInInput(this.inputTypeOptionFilterInput, inputType);

        let optionLocator = lib.slickRowByDisplayName(xpath.inputTypeSetView, inputType);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        let elements = await this.getDisplayedElements(optionLocator);
        await elements[0].click();
        return await this.pause(200);
    }

    async expandInputTypeMenu() {
        await this.scrollPanel(600);
        await this.clickOnElement(this.inputTypeMenuButton);
        return await this.pause(400);
    }

    async resetInputTypeOption() {
        await this.expandInputTypeMenu(600);
        return await this.selectMenuItem("Reset");
    }

    async selectMenuItem(menuItem) {
        let res = await this.getDisplayedElements(`//li[contains(@id,'MenuItem') and text()='${menuItem}']`);
        await res[0].waitForEnabled(
            {timeout: appConst.mediumTimeout, timeoutMsg: `free form -  menu item '${menuItem}'] should be enabled!`});
        await res[0].click();
        return await this.pause(400);
    }

    async clickOnAddButton() {
        try {
            await this.waitForAddButtonDisplayed();
            await this.pause(300);
            await this.scrollAndClickOnElement(this.addButton);
            //await this.clickOnElement(this.addButton);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_add_btn_nested_set');
            throw new Error("Nested Item set, Add block button, screenshot:" + screenshot + ' ' + err);
        }
    }

    //Expands the selector and clicks on the option, index is a number of occurrence block
    async expandOptionsAndSelectElementType(option, index) {
        await this.waitUntilDisplayed(this.elementTypeDropDownHandle, appConst.mediumTimeout);
        let elements = await this.getDisplayedElements(this.elementTypeDropDownHandle);
        await elements[index].click();
        let optionLocator = xpath.elementTypeSetView + lib.itemByDisplayName(option);
        await this.waitUntilDisplayed(optionLocator, appConst.mediumTimeout);
        let optionsElements = await this.getDisplayedElements(optionLocator);
        await optionsElements[0].click();
        return await this.pause(300);
    }

}

module.exports = FreeFormView;
