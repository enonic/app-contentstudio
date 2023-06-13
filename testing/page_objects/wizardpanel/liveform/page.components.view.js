/**
 * Created on 28.03.2018.
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const BasePageComponentView = require('../base.page.components.view');
const xpath = {
    container: "//div[contains(@id,'PageComponentsView') and contains(@class,'draggable')]",
    minimizeButton: "//button[@title='Minimize']",
    maximizeButton: "//button[@title='Maximize']",
    pageComponentsItemViewer: "//div[contains(@id,'PageComponentsItemViewer')]",
};

//Modal Dialog:
class PageComponentView extends BasePageComponentView {

    get container() {
        return xpath.container;
    }

    get minimizeButton() {
        return xpath.container + xpath.minimizeButton;
    }

    get maximizeButton() {
        return xpath.container + xpath.maximizeButton;
    }

    async clickOnMinimizeButton() {
        await this.clickOnElement(this.minimizeButton);
    }

    async clickOnMaximizeButton() {
        await this.clickOnElement(this.maximizeButton);
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(this.container, appConst.mediumTimeout);
    }

    waitForMinimizeDialogButtonDisplayed() {
        return this.waitForElementDisplayed(this.minimizeButton, appConst.mediumTimeout);
    }
}

module.exports = PageComponentView;
