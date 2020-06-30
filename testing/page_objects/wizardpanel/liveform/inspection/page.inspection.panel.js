/**
 * Created on 15.02.2018.
 */

const Page = require('../../../page');
const lib = require('../../../../libs/elements');
const appConst = require('../../../../libs/app_const');

const xpath = {
    container: "//div[contains(@id,'InspectionsPanel')]",
    pageTemplateSelector: `//div[contains(@id,'PageTemplateAndControllerSelector')]`,
};

class PageInspectionPanel extends Page {

    get templateAndControllerOptionFilterInput() {
        return xpath.container + xpath.pageTemplateSelector + lib.DROPDOWN_OPTION_FILTER_INPUT;
    }

    get pageTemplateDropdownHandle() {
        return xpath.container + xpath.pageTemplateSelector + lib.DROP_DOWN_HANDLE;
    }

    clickOnPageTemplateDropdownHandle() {
        return this.clickOnElement(this.pageTemplateDropdownHandle).catch(err => {
            this.saveScreenshot('err_click_on_dropdownhandle_inspection');
            throw new Error('page template selector: ' + err);
        }).then(() => {
            return this.pause(700);
        });
    }

    getPageTemplateDropdownOptions() {
        return this.clickOnPageTemplateDropdownHandle().then(() => {
            let selector = lib.SLICK_ROW + "//div[contains(@id,'PageTemplateAndSelectorViewer')]" + lib.P_SUB_NAME;
            return this.getTextInElements(selector);
        });
    }

    //clicks on dropdown handle and select an option
    selectPageTemplateOrController(displayName) {
        let optionSelector = lib.slickRowByDisplayName(xpath.pageTemplateSelector, displayName);
        return this.waitForElementDisplayed(this.pageTemplateDropdownHandle, appConst.longTimeout).then(() => {
            return this.clickOnPageTemplateDropdownHandle();
        }).then(() => {
            return this.waitForElementDisplayed(optionSelector, appConst.mediumTimeout);
        }).then(() => {
            return this.clickOnElement(optionSelector);
        }).then(() => {
            return this.pause(700);
        }).catch(err => {
            this.saveScreenshot('err_select_option');
            throw new Error('Page Inspection Panel' + err);
        });
    }

    waitForOpened(ms) {
        return this.waitForElementDisplayed(xpath.container, ms);
    }
};
module.exports = PageInspectionPanel;
