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
        try {
            await this.waitForElementDisplayed(this.dropDownHandleInSingleSelection, appConst.mediumTimeout);
            await this.clickOnElement(this.dropDownHandleInSingleSelection);
            let optionLocator = xpath.singleSelectionView + lib.itemByDisplayName(option);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            return await this.clickOnElement(optionLocator);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_optionset"));
            throw new Error(err);
        }
    }

    async expandFormByLabel(formName) {
        try {
            let locator = `//div[contains(@id,'FormOccurrenceDraggableLabel') and text()=${formName}]`;
            let elements = await this.findElements(locator).click();
            return await elements[0].click();
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_optionset_expand"));
            throw new Error(err);
        }
    }
}

module.exports = OptionSetFormView;
