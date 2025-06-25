/**
 * Created on 10.04.2021.
 */
const BaseOptionSetFormView = require('./base.option.set.form.view');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const FilterableListBox = require('../../components/selectors/filterable.list.box');

const xpath = {
    formOptionSet: "//div[contains(@id,'FormOptionSetView') and descendant::h5[text()='Single selection']]",
    textBlockView: "//div[contains(@id,'FormOptionSetOccurrenceView') and descendant::div[text()='Text block']]",
    dropDownDiv: "//div[contains(@id,'Dropdown')]",
    optionSetMenuButton: "//div[contains(@id,'FormOptionSetOccurrenceView')]" + lib.BUTTONS.MORE_BUTTON,
    resetMenuItem: "//div[contains(@id,'FormOptionSetOccurrenceView')]//li[contains(@id,'MenuItem') and text()='Reset']",
    checkboxByLabel: label => `//div[contains(@id,'Checkbox') and descendant::span[text()='${label}']]//label`,
};

class OptionSetForm2View extends BaseOptionSetFormView {

    get formOptionSet() {
        return xpath.formOptionSet;
    }

    get selectionDropDownHandle() {
        return xpath.formOptionSet + xpath.dropDownDiv + lib.DROP_DOWN_HANDLE;
    }

    get optionSetMenuButton() {
        return xpath.formOptionSet + xpath.optionSetMenuButton;
    }

    //Options - Text bloc or Images
    async selectOption(optionDisplayName) {
        let filterableListBox = new FilterableListBox();
        await filterableListBox.clickOnDropdownHandle(this.formOptionSet);
        await filterableListBox.clickOnOptionByDisplayName(optionDisplayName);
    }

    async clickOnRadioButton(label) {
        let locator = xpath.textBlockView + xpath.checkboxByLabel(label);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.clickOnElement(locator);
    }

    async expandFormByLabel(formName) {
        let locator = `//div[contains(@id,'FormOccurrenceDraggableLabel') and text()=${formName}]`;
        let elements = await this.findElements(locator).click();
        return await elements[0].click();
    }

    async expandOptionSetMenu() {
        await this.waitForElementDisplayed(this.optionSetMenuButton, appConst.mediumTimeout);
        await this.clickOnElement(this.optionSetMenuButton);
        return await this.pause(400);
    }

    async clickOnResetMenuItem() {
        await this.expandOptionSetMenu();
        let resetMenuItems = await this.getDisplayedElements(xpath.resetMenuItem);
        await resetMenuItems[0].click();
        return await this.pause(400);
    }

    async waitForOptionSetRedBorderDisplayed() {
        let locator = xpath.formOptionSet + "//div[contains(@id,'FormOptionSetOccurrenceView')]";
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, "class");
            return !result.includes("hide-validation-errors");
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Red border should be displayed in Option Set Form!"});
    }
}

module.exports = OptionSetForm2View;
