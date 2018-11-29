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
    waitForInboundButtonVisible: {
        value: function () {
            return this.waitForVisible(this.showInboundButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_inbound_button');
                throw new Error('showInboundButton: is not visible in ' + appConst.TIMEOUT_2);
            });
        }
    },
    isInboundButtonVisible: {
        value: function () {
            return this.isVisible(this.showInboundButton);
        }
    },
    waitForOutboundButtonVisible: {
        value: function () {
            return this.waitForVisible(this.showOutboundButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_outbound_button');
                throw new Error('showOutboundButton is not visible in ' + appConst.TIMEOUT_2);
            });
        }
    },
    waitForOutboundButtonNotVisible: {
        value: function () {
            return this.waitForNotVisible(this.showOutboundButton, appConst.TIMEOUT_2).catch(err => {
                this.saveScreenshot('err_outbound_button_should_be_hidden');
                throw new Error('showOutboundButton still visible in ' + appConst.TIMEOUT_2);
            });
        }
    },
    waitForWidgetLoaded: {
        value: function () {
            return this.waitForVisible(this.dependenciesWidget, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Content Wizard: Dependencies Widget was not loaded in ' + appConst.TIMEOUT_2);
            });
        }
    },
    getNumberOutboundItems: {
        value: function () {
            return this.waitForVisible(this.showOutboundButton).then(() => {
                return this.getText(this.showOutboundButton);
            }).then(result => {
                let startIndex = result.indexOf('(');
                let endIndex = result.indexOf(')');
                return result.substring(startIndex + 1, endIndex);
            })
        }
    }
});
module.exports = wizardDependenciesWidget;


