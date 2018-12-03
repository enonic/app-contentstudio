/**
 * Created on 29/11/2018.
 */
const baseDependenciesWidget = require('../../details_panel/base.dependencies.widget');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    widget: `//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'DependenciesWidgetItemView')]`,
    showOutboundButton: `//button/span[contains(.,'Show Outbound')]`,
    showInboundButton: `//button/span[contains(.,'Show Inbound')]`

};
const browseDependenciesWidget = Object.create(baseDependenciesWidget, {

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
    waitForWidgetLoaded: {
        value: function () {
            return this.waitForVisible(this.dependenciesWidget, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Content Wizard: Dependencies Widget was not loaded in ' + appConst.TIMEOUT_2);
            });
        }
    },
});
module.exports = browseDependenciesWidget;


