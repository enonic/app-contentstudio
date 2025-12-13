/**
 * Created on 29/11/2018.
 */
const BaseDependenciesWidget = require('../../details_panel/base.dependencies.widget');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');

const xpath = {
    widget: "//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'DependenciesWidgetItemView')]",
    showOutboundButton: "//button/span[contains(.,'Show Outbound')]",
    showInboundButton: "//button/span[contains(.,'Show Inbound')]"
};

class BrowseDependenciesWidget extends BaseDependenciesWidget {

    get dependenciesWidget() {
        return xpath.widget;
    }

    get showOutboundButton() {
        return xpath.widget + lib.actionButton('Show Outbound');
    }

    get showInboundButton() {
        return xpath.widget + xpath.showInboundButton;
    }

    isWidgetVisible() {
        return this.isElementDisplayed(this.dependenciesWidget);
    }

    async waitForWidgetLoaded() {
        try {
            await this.waitForElementDisplayed(this.dependenciesWidget, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Dependencies Widget was not loaded!', 'err_dep_widget_load', err);
        }
    }
}

module.exports = BrowseDependenciesWidget;


