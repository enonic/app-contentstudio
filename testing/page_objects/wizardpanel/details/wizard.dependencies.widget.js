/**
 * Created on 31/07/2018.
 */
const baseDependenciesWidget = require('../../details_panel/base.dependencies.widget');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    widget: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'DependenciesWidgetItemView')]`,
    showOutboundButton: `//button/span[contains(.,'Show Outbound')]`,
    showInboundButton: `//button/span[contains(.,'Show Inbound')]`
};
const wizardDependenciesWidget = Object.create(baseDependenciesWidget, {

    dependenciesWidget: {
        get: function () {
            return `${xpath.widget}`;
        }
    },
    showOutboundButton: {
        get: function () {
            return `${xpath.widget}` + `${xpath.showOutboundButton}`;
        }
    },
    showInboundButton: {
        get: function () {
            return `${xpath.widget}` + `${xpath.showInboundButton}`;
        }
    },
    isWidgetVisible: {
        value: function () {
            return this.isVisible(this.dependenciesWidget);
        }
    },
    //waits for Dependencies Widget is loaded, returns false after the timeout exceeded
    isWidgetLoaded: {
        value: function () {
            return this.waitForVisible(this.dependenciesWidget, appConst.TIMEOUT_2).catch(err => {
               return false
            });
        }
    },
    //waits for Version Widget is loaded, Exception will be thrown after the timeout exceeded
    waitForWidgetLoaded: {
        value: function () {
            return this.waitForVisible(this.dependenciesWidget, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Content Wizard: Dependencies Widget was not loaded in ' + appConst.TIMEOUT_2);
            });
        }
    },
});
module.exports = wizardDependenciesWidget;


