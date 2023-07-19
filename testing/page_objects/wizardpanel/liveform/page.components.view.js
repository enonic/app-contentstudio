/**
 * Created on 28.03.2018.
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const BasePageComponentView = require('../base.page.components.view');
const xpath = {
    container: "//div[contains(@id,'PageComponentsView') and contains(@class,'draggable')]",
    hideComponentViewButton: "//button[@title='Hide Component View']",
    pageComponentsItemViewer: "//div[contains(@id,'PageComponentsItemViewer')]",
};

// Modal Dialog:
class PageComponentView extends BasePageComponentView {

    get container() {
        return xpath.container;
    }

    get hideComponentViewButton() {
        return xpath.container + xpath.hideComponentViewButton;
    }

    get componentViewToggleButton() {
        return "//div[contains(@id,'PageComponentsView')]//button[contains(@class,'minimize-button')]";
    }

    async clickOnHideComponentViewButton() {
        await this.waitForHideComponentViewButtonDisplayed();
        await this.clickOnElement(this.hideComponentViewButton);
    }
    waitForHideComponentViewButtonDisplayed() {
        return this.waitForElementDisplayed(this.hideComponentViewButton, appConst.mediumTimeout);
    }

    waitForComponentViewToggleButtonDisplayed() {
        return this.waitForElementDisplayed(this.componentViewToggleButton, appConst.mediumTimeout);
    }

    async clickOnComponentViewToggleButton() {
        await this.waitForComponentViewToggleButtonDisplayed();
        await this.clickOnElement(this.componentViewToggleButton);
        await this.pause(400);
    }

    waitForComponentViewToggleButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.componentViewToggleButton, appConst.mediumTimeout);
    }

    async waitForLoaded() {
        await this.waitForElementDisplayed(this.container, appConst.mediumTimeout);
        await this.pause(700);
    }

    waitForNotDisplayed() {
        return this.waitForElementNotDisplayed(this.container, appConst.mediumTimeout);
    }

    async waitForCollapsed() {
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(this.container, 'class');
            return result.includes('collapsed');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Page Component View modal dialog should be closed"});
    }
}

module.exports = PageComponentView;
