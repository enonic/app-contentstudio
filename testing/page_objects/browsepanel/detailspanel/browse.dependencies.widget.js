/**
 * Created on 29/11/2018. updated on 29.06.2026
 */
const BaseDependenciesWidget = require('../../details_panel/base.dependencies.widget');
const appConst = require('../../../libs/app_const');

const xpath = {
    widget: "//div[contains(@id,'ContentBrowsePanel')]//div[@data-component='DependenciesWidget']",
    showAllOutgoingButton: "//button[contains(@aria-label,'Show all outgoing')]",
    showAllIncomingButton: "//button[contains(@aria-label,'Show all incoming')]",
};

class BrowseDependenciesWidget extends BaseDependenciesWidget {

    get dependenciesWidget() {
        return xpath.widget;
    }

    get showAllOutgoingButton() {
        return xpath.widget + xpath.showAllOutgoingButton;
    }

    get showAllIncomingButton() {
        return xpath.widget + xpath.showAllIncomingButton;
    }

    isWidgetVisible() {
        return this.isElementDisplayed(this.dependenciesWidget);
    }

    async waitForWidgetLoaded() {
        try {
            await this.waitForElementDisplayed(this.dependenciesWidget, appConst.shortTimeout);
            await this.pause(400);
        } catch (err) {
            await this.handleError('Dependencies Widget was not loaded', 'err_widget_load', err);
        }
    }
}

module.exports = BrowseDependenciesWidget;


