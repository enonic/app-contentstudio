/**
 * Created on 20.07.2021
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    widget: "//div[contains(@id,'ContentWizardPanel')]//div[contains(@id,'EmulatorWidgetItemView')]",
    emulatorGrid: "//div[contains(@id,'EmulatorGrid')]",
    resolutions: "//div[contains(@class,'slick-row')]//h5",
    resolutionByName: resolution => `//div[contains(@class,'slick-row') and descendant::h5[text()='${resolution}']]//h5`,
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
        let locator = xpath.widget + xpath.resolutionByName(resolution);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(400);
    }

    getResolutions() {
        let locator = xpath.widget + xpath.resolutions;
        return this.getTextInDisplayedElements(locator);
    }
}

module.exports = EmulatorWidget;

