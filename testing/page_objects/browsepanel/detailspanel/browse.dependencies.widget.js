/**
 * Created on 29/11/2018.
 */
const BaseDependenciesWidget = require('../../details_panel/base.dependencies.widget');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements-old');

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
            await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_widget_load');
            throw new Error(`Content Wizard: Dependencies Widget was not screenshot:${screenshot} ` + err);
        }
    }
}

module.exports = BrowseDependenciesWidget;


