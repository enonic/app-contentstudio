/**
 * Created on 22.02.2024
 */
const BasDropdown = require('../selectors/base.dropdown');
const {DROPDOWN} = require("../../../libs/elements");


// Applications Step wizard( or form panel) - select an application in the dropdown selector
class ProjectApplicationsCombobox extends BasDropdown {

    constructor(parentElementXpath) {
        super();
        this._parentContainer = parentElementXpath;
    }

    get container() {
        return this._parentContainer
    }
    get dataComponentDiv() {
        return "//div[@data-component='ApplicationSelector']";
    }

    optionsFilterInput() {
        return this.container + DROPDOWN.OPTION_FILTER_INPUT;
    }

    async clickFilteredByAppNameItemAndClickOnOk(appDisplayName) {
        try {
            await this.doFilterItem(appDisplayName);
            await this.clickOnOptionByDisplayName(appDisplayName);
            await this.clickOnApplySelectionButton();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error(`Error occurred in Project Applications Comboboox selector, screenshot:${screenshot} ` + err);
        }
    }
}

module.exports = ProjectApplicationsCombobox;
