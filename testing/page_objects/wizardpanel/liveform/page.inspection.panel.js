/**
 * Created on 15.02.2018.
 */

const page = require('../../page');
const elements = require('../../../libs/elements');
const panel = {
    container: "//div[contains(@id,'PageInspectionPanel')]",
    pageControllerSelector: "//div[contains(@id,'PageControllerSelector')]",
    pageTemplateSelector: `//div[contains(@id,'PageTemplateSelector')]`,

};

const pageInspectionPanel = Object.create(page, {

    pageTemplateDropdownHandle: {
        get: function () {
            return `${panel.container}` + `${panel.pageTemplateSelector}` + `${elements.DROP_DOWN_HANDLE}`;
        }
    },
    clickOnPageTemplateDropdownHandle: {
        value: function () {
            return this.doClick(this.pageTemplateDropdownHandle).pause(800).catch(err=> {
                this.saveScreenshot('err_click_on_dropdownhandle_inspection');
                throw new Error('page template selector: ' + err);
            });
        }
    },
    getPageTemplateDropdownOptions: {
        value: function () {
            return this.clickOnPageTemplateDropdownHandle().pause(1000).then(()=> {
                let selector = elements.SLICK_ROW + "//div[contains(@id,'PageTemplateOptionViewer')]" + elements.P_SUB_NAME;
                return this.getTextFromElements(selector);
            });
        }
    },
    waitForOpened: {
        value: function (ms) {
            return this.waitForVisible(panel.container, ms);
        }
    },
});
module.exports = pageInspectionPanel;
