/**
 * Created on 31/07/2018.
 */
const BaseDependenciesWidget = require('../../details_panel/base.dependencies.widget');
const appConst = require('../../../libs/app_const');

const xpath = {
    widget: `//div[contains(@id,'ContentWizardPanel')]//div[@data-component='DependenciesWidget']`,
    showAllOutgoingButton: `//button[contains(@aria-label,'Show all outgoing')]`,
    showAllIncomingButton: `//button[contains(@aria-label,'Show all incoming')]`,
};

class WizardDependenciesWidget extends BaseDependenciesWidget {

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
            await this.pause(500);
        } catch (err) {
            await this.handleError('Wizard: Dependencies Widget', 'err_dependencies_widget_loaded', err);
        }
    }
}

module.exports = WizardDependenciesWidget;


