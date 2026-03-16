/**
 * Created on 12.02.2024 updated for epic-enonic-ui on 26.02.2026
 */
const BasDropdown = require('./base.dropdown');
const {DROPDOWN} = require('../../../libs/elements');

class AccessControlCombobox extends BasDropdown {

    constructor(parentElementXpath) {
        super();
        this._parentContainer = parentElementXpath;
    }

    get container() {
        return this._parentContainer
    }

    optionsFilterInput() {
        return this.container + DROPDOWN.OPTION_FILTER_INPUT;
    }

    async clickOnFilteredPrincipalAndApply(principal) {
        try {
            await this.doFilterItem(principal);
            await this.clickOnOptionByDisplayName(principal);
            await this.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(`AccessControlComboBox, tried to click on the option: ${principal} and apply changes`,
                'err_click_option_apply', err);
        }
    }
}

module.exports = AccessControlCombobox;
