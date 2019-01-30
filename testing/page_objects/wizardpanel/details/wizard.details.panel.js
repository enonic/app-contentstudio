/**
 * Created on 30/07/2018.
 */
const baseDetailsPanel = require('../../details_panel/base.details.panel');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'DockedContextPanel')]`,
    widgetSelectorDropdown: `//div[contains(@id,'WidgetSelectorDropdown')]`,

};
const wizardDetailsPanel = Object.create(baseDetailsPanel, {

    widgetSelectorDropdown: {
        get: function () {
            return `${xpath.container}` + `${xpath.widgetSelectorDropdown}`;
        }
    },
    widgetSelectorDropdownHandle: {
        get: function () {
            return `${xpath.container}` + `${xpath.widgetSelectorDropdown}` + `${elements.DROP_DOWN_HANDLE}`;
        }
    },
    waitForDetailsPanelLoaded: {
        value: function () {
            return this.getBrowser().waitUntil(() => {
                return this.element(xpath.container).catch(err=>{
                    throw new Error("Error when checkin Deatils Panel is wizard" + err);
                }).then(el => {
                    return this.getBrowser().elementIdCssProperty(el.value.ELEMENT, "width");
                }).then(width => {
                    console.log("COMPARE: " + (width.value) + " " + ( getPanelWidth( width.value) > 0));
                    return getPanelWidth( width.value) > 0;
                })
            }, 2000, "Details Panel was not loaded in 2000!!!");
        }
    },

    isDetailsPanelLoaded: {
        value: function () {
            return this.getBrowser().waitUntil(() => {
                return this.element(xpath.container).then(el => {
                    return this.getBrowser().elementIdCssProperty(el.value.ELEMENT, "width");
                }).then(width => {
                    console.log("width: " + width.value);
                    console.log("COMPARE: " + (width.value) + " " + (getPanelWidth( width.value) > 0));
                    return getPanelWidth( width.value) > 0;
                });
            }, 1000).catch(err => {
                console.log("Wizard details panel was not loaded" + err);
                return false;
            });
        }
    },
});

function getPanelWidth(width) {
    return width.substring(0, width.indexOf("px"));

};
module.exports = wizardDetailsPanel;


