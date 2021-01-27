/**
 * Created on 23.01.2019.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    singleSelectionView: "//div[contains(@id,'FormOptionSetOccurrenceView') and contains(@class,'single-selection')]",
    dropDownDiv: "//div[contains(@id,'Dropdown')]",
};

class OptionSetFormView extends Page {

    get dropDownHandleInSingleSelection() {
        return xpath.singleSelectionView + xpath.dropDownDiv + lib.DROP_DOWN_HANDLE;
    }

    async selectOptionInSingleSelection(option) {
        let dropDownHandlerLocator = this.dropDownHandleInSingleSelection;
        await this.waitForElementDisplayed(dropDownHandlerLocator, appConst.mediumTimeout);
        await this.clickOnElement(dropDownHandlerLocator);
        let optionLocator = xpath.singleSelectionView + lib.itemByDisplayName(option);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        return await this.clickOnElement(optionLocator);
    }

    async expandFormByLabel(formName) {
        let locator = `//div[contains(@id,'FormOccurrenceDraggableLabel') and text()=${formName}]`;
        let elements = await this.findElements(locator).click();
        return await elements[0].click();
    }
}

module.exports = OptionSetFormView;
