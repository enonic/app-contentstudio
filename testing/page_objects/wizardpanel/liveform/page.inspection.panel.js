/**
 * Created on 15.02.2018.
 */

const page = require('../../page');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: "//div[contains(@id,'InspectionsPanel')]",
    pageTemplateSelector: `//div[contains(@id,'PageTemplateAndControllerSelector')]`,
};

const pageInspectionPanel = Object.create(page, {

    templateAndControllerOptionFilterInput: {
        get: function () {
            return `${xpath.container}` + `${xpath.pageTemplateSelector}` + `${elements.DROPDOWN_OPTION_FILTER_INPUT}`;
        }
    },
    pageTemplateDropdownHandle: {
        get: function () {
            return `${xpath.container}` + `${xpath.pageTemplateSelector}` + `${elements.DROP_DOWN_HANDLE}`;
        }
    },
    clickOnPageTemplateDropdownHandle: {
        value: function () {
            return this.doClick(this.pageTemplateDropdownHandle).catch(err => {
                this.saveScreenshot('err_click_on_dropdownhandle_inspection');
                throw new Error('page template selector: ' + err);
            }).pause(1000);
        }
    },
    getPageTemplateDropdownOptions: {
        value: function () {
            return this.clickOnPageTemplateDropdownHandle().then(() => {
                let selector = elements.SLICK_ROW + "//div[contains(@id,'PageTemplateAndSelectorViewer')]" + elements.P_SUB_NAME;
                return this.getTextFromElements(selector);
            });
        }
    },
    //clicks on dropdown handle and select an option
    selectPageTemplateOrController: {
        value: function (displayName) {
            let optionSelector = elements.slickRowByDisplayName(xpath.pageTemplateSelector, displayName);
            return this.waitForVisible(this.pageTemplateDropdownHandle, appConst.TIMEOUT_5).then(() => {
                return this.clickOnPageTemplateDropdownHandle();
            }).then(() => {
                return this.waitForVisible(optionSelector, appConst.TIMEOUT_3);
            }).catch(err => {
                throw new Error('option was not found! ' + displayName + ' ' + err);
            }).then(() => {
                return this.doClick(optionSelector).catch(err => {
                    this.saveScreenshot('err_select_option');
                    throw new Error('option not found!' + displayName);
                }).pause(700);
            });
        }
    },

    waitForOpened: {
        value: function (ms) {
            return this.waitForVisible(xpath.container, ms);
        }
    },
});
module.exports = pageInspectionPanel;
