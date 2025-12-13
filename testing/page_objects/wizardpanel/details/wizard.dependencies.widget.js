/**
 * Created on 31/07/2018.
 */
const BaseDependenciesWidget = require('../../details_panel/base.dependencies.widget');
const appConst = require('../../../libs/app_const');

const xpath = {
    widget: `//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'DependenciesWidgetItemView')]`,
    showOutboundButton: `//button/span[contains(.,'Show Outbound')]`,
    showInboundButton: `//button/span[contains(.,'Show Inbound')]`
};

class WizardDependenciesWidget extends BaseDependenciesWidget {

    get dependenciesWidget() {
        return xpath.widget;
    }

    get showOutboundButton() {
        return xpath.widget + xpath.showOutboundButton;
    }

    get showInboundButton() {
        return xpath.widget + xpath.showInboundButton;
    }

    isWidgetVisible() {
        return this.isElementDisplayed(this.dependenciesWidget);
    }

    //waits for Dependencies Widget is loaded, returns false after the timeout exceeded
    isWidgetLoaded() {
        return this.waitForElementDisplayed(this.dependenciesWidget, appConst.shortTimeout).catch(err => {
            return false
        });
    }

    //waits for Version Widget is loaded, Exception will be thrown after the timeout exceeded
    async waitForWidgetLoaded() {
        try {
            await this.waitForElementDisplayed(this.dependenciesWidget, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Wizard: Dependencies Widget', 'err_dependencies_widget_loaded', err);
        }
    }
}

module.exports = WizardDependenciesWidget;


