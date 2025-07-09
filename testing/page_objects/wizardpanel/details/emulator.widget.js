/**
 * Created on 20.07.2021
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const studioUtils = require('../../../libs/studio.utils.js');

const xpath = {
    widget: "//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'EmulatorWidgetItemView')]",
    emulatorGrid: "//ul[contains(@id,'EmulatorGrid')]",
    resolutions: "//li[contains(@id,'EmulatorListElement')]//h5",
    resolutionByName: resolution => `//li[contains(@id,'EmulatorListElement') and descendant::h5[text()='${resolution}']]//h5`,
};

class EmulatorWidget extends Page {

    get emulatorWidget() {
        return xpath.widget;
    }

    get widgetItemView() {
        return xpath.widgetItemView;
    }

    getTitle() {
        return this.getText(xpath.widget + "/p");
    }

    async clickOnResolution(resolution) {
        try {
            let locator = xpath.widget + xpath.resolutionByName(resolution);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(400);
        } catch (err) {
            await this.handleError('Emulator Widget', 'err_emulator_widget_click_resolution', err);
        }
    }

    getResolutions() {
        let locator = xpath.widget + xpath.resolutions;
        return this.getTextInDisplayedElements(locator);
    }
}

module.exports = EmulatorWidget;

