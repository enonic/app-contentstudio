/**
 * Created on 28.11.2025
 */
const BaseComponentInspectionPanel = require('./base.component.inspection.panel');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');
const ImageSelectorDropdown = require('../../../components/selectors/image.selector.dropdown');
const ComponentDescriptorsDropdown = require('../../../components/selectors/component.descriptors.dropdown');

const xpath = {
    container: `//div[contains(@id,'PartInspectionPanel')]`,
    componentDescriptorsDropdownDiv: "//div[contains(@id,'ComponentDescriptorsDropdown')]",
};

// Context Window, Inspect tab for all part components
class BasePartInspectionPanel extends BaseComponentInspectionPanel {

    get container() {
        return xpath.container;
    }

    get partSelectorDropdownHandle() {
        return xpath.container + lib.DROPDOWN_SELECTOR.PART_COMPONENT_DROPDOWN + lib.DROPDOWN_SELECTOR.DROPDOWN_HANDLE;
    }

    get partSelectorOptionsFilterInput() {
        return xpath.container + lib.DROPDOWN_SELECTOR.PART_COMPONENT_DROPDOWN + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    async clickOnPartSelectorDropdownHandle() {
        try {
            await this.clickOnElement(this.partSelectorDropdownHandle);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError('Part Inspection Panel', 'err_inspect_panel_part_selector_dropdown', err);
        }
    }

    async clickOnPartInOptionList(partName) {
        try {
            let componentDescriptorsDropdown = new ComponentDescriptorsDropdown();
            await componentDescriptorsDropdown.clickOnOptionByDisplayName(partName, this.container);
            return await this.pause(1000);
        }catch (err) {
            await this.handleError('Part Inspection Panel, tried to click on the option  in the expanded list', 'err_click_part_in_option_list', err);
        }
    }


    async waitForLoaded() {
        try {
            return this.waitForElementDisplayed(xpath.container, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError('Part Inspection Panel', 'err_load_part_inspect_panel', err);
        }
    }

}

module.exports = BasePartInspectionPanel;

