/**
 * Created on 29/11/2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    widget: `//div[contains(@id,'ContentBrowsePanel')]//div[contains(@id,'DependenciesWidgetItemView')]`,
    showOutboundButton: `//button/span[contains(.,'Show Outbound')]`,
    showInboundButton: `//button/span[contains(.,'Show Inbound')]`
};

class BrowseDependenciesWidget extends Page {

    get dependenciesWidget() {
        return xpath.widget;
    }

    get showOutboundButton() {
        return xpath.widget + xpath.showOutboundButton;
    }

    showInboundButton() {
        return xpath.widget + xpath.showInboundButton;
    }

    isWidgetVisible() {
        return this.isElementDisplayed(this.dependenciesWidget);
    }

    waitForWidgetLoaded() {
        return this.waitForElementDisplayed(this.dependenciesWidget, appConst.shortTimeout).catch(err => {
            throw new Error('Content Wizard: Dependencies Widget was not loaded in ' + appConst.shortTimeout);
        });
    }
};
module.exports = BrowseDependenciesWidget;


