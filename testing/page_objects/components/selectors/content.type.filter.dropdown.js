/**
 * Created on 08.01.2024 updated on 09.06.2026
 */
const BaseDropdown = require('./base.dropdown');
const {DROPDOWN} = require("../../../libs/elements");
const XPATH = {
    container: "//div[@data-component='ContentTypeFilterInput']",
};

class ContentTypeFilterDropdown extends BaseDropdown {

    constructor(parentElementXpath) {
        super();
        this._container = parentElementXpath;
    }

    // returns the element that contains the dropdown:
    get container() {
        return this._container;
    }

    optionsFilterInput() {
        return this.dataComponentDiv + DROPDOWN.OPTION_FILTER_INPUT;
    }

    get dataComponentDiv() {
        return "//div[contains(@data-component,'ContentTypeFilterInput')]";
    }

    async selectFilteredContentTypeAndClickOnApply(item) {
        try {
            await this.doFilterItem(item);
            await this.clickOnTreeItemOptionByDisplayName(item);
            await this.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(`ContentTypeFilterDropdown, cannot select ${item} content type and click on Apply`, 'err_select_content_type_and_apply', err);
        }
    }
}

module.exports = ContentTypeFilterDropdown;
