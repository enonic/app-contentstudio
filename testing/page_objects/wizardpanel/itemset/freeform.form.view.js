/**
 * Created on 12.04.2019.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');
const FilterableListBox = require('../../components/selectors/filterable.list.box');

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
               lib.DROPDOWN_SELECTOR.FILTERABLE_LISTBOX + lib.DROP_DOWN_HANDLE;
    }

    get inputTypeOptionFilterInput() {
        return xpath.itemSet + xpath.inputTypeSetView + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    get inputTypeDropDownHandle() {
        return xpath.itemSet + xpath.inputTypeSetView + lib.DROPDOWN_SELECTOR.FILTERABLE_LISTBOX + lib.DROP_DOWN_HANDLE;
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

    // Clicks on a filtered option, then click on 'OK' button :
    async selectInputType(inputTypeName) {
        await this.scrollPanel(800);
        await this.pause(300);
        let filterableListBox = new FilterableListBox();
        await filterableListBox.clickOnFilteredByDisplayNameItem(inputTypeName, xpath.itemSet);
    }

    async expandInputTypeMenu() {
        await this.scrollPanel(600);
        await this.clickOnElement(this.inputTypeMenuButton);
        return await this.pause(400);
    }

    async resetInputTypeOption() {
        await this.expandInputTypeMenu();
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
            await this.scrollAndClickOnElement(this.addButton);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_add_btn_nested_set');
            throw new Error("Nested Item set, Add block button, screenshot:" + screenshot + ' ' + err);
        }
    }

    // Clicks on dropdown handle in FilterableListBox with the label 'element type' then clicks on an option
    async expandOptionsAndSelectElementType(optionDisplayName, occurrenceIndex) {
        let filterableListBox = new FilterableListBox();
        await this.waitUntilDisplayed(this.elementTypeDropDownHandle, appConst.mediumTimeout);
        let dropdownElements = await this.getDisplayedElements(this.elementTypeDropDownHandle);
        if (dropdownElements.length === 1) {
            await dropdownElements[0].click();
        } else {
            await dropdownElements[occurrenceIndex].click();
        }

        let occurrencesXpath = "//div[contains(@class,'occurrence-views-container')]//div[contains(@id,'FormItemSetOccurrenceView')]";
        let occurrences = await this.findElements(occurrencesXpath);
        let optionLocator = filterableListBox.buildLocatorForOptionByDisplayName(optionDisplayName);
        // get options in the root occurrence item(it is parent for all items)
        let optionElements = await occurrences[0].$$('.' + optionLocator);
        let displayedElements = await this.doFilterDisplayedElements(optionElements);
        await displayedElements[0].click();
        return await this.pause(300);
    }
}

module.exports = FreeFormView;
