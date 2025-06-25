/**
 * Created on 23.01.2019.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const FilterableListBox = require('../../components/selectors/filterable.list.box');

const xpath = {
    singleSelectionView: "//div[contains(@id,'FormOptionSetOccurrenceView') and contains(@class,'single-selection')]",
};

class OptionSetFormView extends Page {

    async selectOptionInSingleSelection(optionDisplayName) {
        try {
            let filterableListBox = new FilterableListBox();
            await filterableListBox.clickOnDropdownHandle(xpath.singleSelectionView);
            await filterableListBox.clickOnOptionByDisplayName(optionDisplayName);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_optionset');
            throw new Error(`Error,after selecting the option in single selection, screenshot:${screenshot} ` + err);
        }
    }

    async expandFormByLabel(formName) {
        try {
            let locator = `//div[contains(@id,'FormOccurrenceDraggableLabel') and text()=${formName}]`;
            let elements = await this.findElements(locator).click();
            return await elements[0].click();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_optionset');
            throw new Error(`Error after expanding the forms, screenshot:${screenshot} ` + err);
        }
    }
}

module.exports = OptionSetFormView;
