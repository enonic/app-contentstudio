/**
 * Created on 23.01.2019.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    singleSelectionView: "//div[contains(@id,'FormOptionSetOccurrenceView') and contains(@class,'single-selection')]",
};

class OptionSetFormView extends Page {

    get dropDownHandleInSingleSelection() {
        return xpath.singleSelectionView + lib.DROPDOWN_DIV + lib.DROP_DOWN_HANDLE;
    }

    async selectOptionInSingleSelection(option) {
        try {
            await this.waitForElementDisplayed(this.dropDownHandleInSingleSelection, appConst.mediumTimeout);
            await this.clickOnElement(this.dropDownHandleInSingleSelection);
            let optionLocator = xpath.singleSelectionView + lib.itemByDisplayName(option);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            await this.clickOnElement(optionLocator);
            return await this.pause(500);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_optionset");
            await this.saveScreenshot(screenshot);
            throw new Error("Error,after selecting the option in single selection, screenshot:" + screenshot + "  " + err);
        }
    }

    async expandFormByLabel(formName) {
        try {
            let locator = `//div[contains(@id,'FormOccurrenceDraggableLabel') and text()=${formName}]`;
            let elements = await this.findElements(locator).click();
            return await elements[0].click();
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_optionset");
            await this.saveScreenshot(screenshot);
            throw new Error("Error after expanding the forms, screenshot:" + screenshot + "  " + err);
        }
    }
}

module.exports = OptionSetFormView;
