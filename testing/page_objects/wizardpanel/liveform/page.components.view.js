/**
 * Created on 28.03.2018.
 */
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const BasePageComponentView = require('../base.page.components.view');

const xpath = {
    container: "//div[contains(@id,'PageComponentsView') and contains(@class,'draggable')]",
    pcvDialogMinimizer: "//button[contains(@id,'Button') and contains(@class,'minimize-button')]",
    showPcvDialogButton: "//button[contains(@id,'Button') and @title='Show Component View']",
    hidePcvDialogButton: "//button[contains(@id,'Button') and @title='Hide Component View']",
    pageComponentsItemViewer: "//div[contains(@id,'PageComponentsItemViewer')]",
};

// Modal Dialog:
class PageComponentView extends BasePageComponentView {

    get container() {
        return xpath.container;
    }

    // Button to Show/Hide Page Component View modal dialog( by the class - 'minimize-button' )
    get pcvDialogMinimizer() {
        return xpath.container + xpath.pcvDialogMinimizer;
    }

    // button by the title 'Show Component View', this button shows PCV modal dialog
    get showPcvDialogButton() {
        return xpath.container + xpath.showPcvDialogButton;
    }

    // button by the title 'Hide Component View', this button hides PCV modal dialog
    get hidePcvDialogButton() {
        return xpath.container + xpath.hidePcvDialogButton;
    }

    //Wait for PCV modal dialog minimizer-toggler is visible
    async waitForPcvDialogMinimizerTogglerVisible() {
        try {
            await this.waitForElementDisplayed(this.pcvDialogMinimizer, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_component_view_minimizer'));
            throw new Error('PCV dialog, minimizer-button should be visible ' + '  ' + err);
        }
    }

    // Button to Show Component View dialog:
    async waitForShowPcvDialogButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.showPcvDialogButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_show_component_view_button');
            throw new Error(`Show Component View button is not visible , screenshot: ${screenshot} ` + err);
        }
    }

    async waitForHidePcvDialogButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.hidePcvDialogButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_component_view_not_displayed');
            throw new Error(`'Hide Component View' button should should be visible, screenshot:${screenshot} `  + err);
        }
    }

    async waitForHidePcvDialogButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.hidePcvDialogButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_component_view_btn');
            throw new Error(`'Hide Component View' button should not be displayed, screenshot: ${screenshot} `  + err);
        }
    }

    // Click on Hide Component View button and close the modal dialog:
    async clickOnHidePageComponentDialogButton() {
        try {
            await this.waitForHidePcvDialogButtonDisplayed();
            await this.clickOnElement(this.hidePcvDialogButton);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_hide_component_view_btn');
            throw new Error(`Error after clicking on 'Hide Component View' button ${screenshot} ` + err);
        }
    }

    async clickOnShowPageComponentDialogButton() {
        try {
            await this.waitForShowPcvDialogButtonDisplayed();
            await this.clickOnElement(this.showPcvDialogButton);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot('err_show_component_view_btn');
            throw new Error("Error when clicking on 'Show Component View' button " + err);
        }
    }

    waitForPcvDialogMinimizerDisplayed() {
        return this.waitForElementDisplayed(this.pcvDialogMinimizer, appConst.mediumTimeout);
    }

    waitForPcvDialogMinimizerNotDisplayed() {
        return this.waitForElementNotDisplayed(this.pcvDialogMinimizer, appConst.mediumTimeout);
    }

    async clickOnComponentViewToggleButton() {
        await this.waitForPcvDialogMinimizerDisplayed();
        await this.clickOnElement(this.pcvDialogMinimizer);
        await this.pause(400);
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
