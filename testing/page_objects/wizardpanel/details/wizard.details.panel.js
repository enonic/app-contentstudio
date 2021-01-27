/**
 * Created on 30/07/2018.
 */
const BaseDetailsPanel = require('../../details_panel/base.details.panel');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'DockedContextPanel')]`,
    widgetSelectorDropdown: `//div[contains(@id,'WidgetSelectorDropdown')]`,
    widgetItem: `//div[contains(@id,'ContentWidgetItemView')]`
};

class WizardDetailsPanel extends BaseDetailsPanel {

    get widgetSelectorDropdown() {
        return xpath.container + xpath.widgetSelectorDropdown;
    }

    get widgetSelectorDropdownHandle() {
        return xpath.container + xpath.widgetSelectorDropdown + lib.DROP_DOWN_HANDLE;
    }

    async icContentInvalid() {
        let selector = xpath.container + xpath.widgetItem + lib.CONTENT_SUMMARY_AND_STATUS_VIEWER;
        let attr = await this.getAttribute(selector, 'class');
        return await attr.includes("invalid");
    }

    waitForDetailsPanelLoaded() {
        return this.getBrowser().waitUntil(() => {
            return this.findElement(xpath.container).catch(err => {
                throw new Error("Error when checking Details Panel in wizard" + err);
            }).then(el => {
                return this.getBrowser().getElementCSSValue(el.elementId, "width");
            }).then(width => {
                //console.log("COMPARE: " + (width.value) + " " + (getPanelWidth(width.value) > 0));
                return getPanelWidth(width) > 100;
            })
        }, appConst.shortTimeout, "Details Panel was not loaded in 2000!!!");
    }

    isDetailsPanelLoaded() {
        return this.getBrowser().waitUntil(() => {
            return this.findElement(xpath.container).then(el => {
                return this.getBrowser().getElementCSSValue(el.elementId, "width");
            }).then(width => {
                console.log("width: " + width);
                return getPanelWidth(width) > 0;
            });
        }, appConst.TIMEOUT_1).catch(err => {
            console.log("Wizard details panel is not loaded" + err);
            return false;
        });
    }
}

function getPanelWidth(width) {
    return width.substring(0, width.indexOf("px"));

};
module.exports = WizardDetailsPanel;


