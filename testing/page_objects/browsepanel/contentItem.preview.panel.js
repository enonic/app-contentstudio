/**
 * Created on 20/06/2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const xpath = {
    container: "//div[contains(@id,'ContentItemPreviewPanel')]",
    toolbar: `//div[contains(@id,'ContentItemPreviewToolbar')]`,
    divPreviewWidgetDropdown: "//div[contains(@id,'PreviewWidgetDropdown')]",
    divEmulatorDropdown: "//div[contains(@id,'EmulatorDropdown')]",
    ulEmulatorListBox: "//ul[contains(@id,'EmulatorListBox')]",
    status: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'status')]`,
    issueMenuButton: `//div[contains(@id,'MenuButton')]`,
    showChangesButtonToolbar: "//button[contains(@class,'show-changes') and @title='Show changes']",
    previewNotAvailableSpan: "//div[@class='no-preview-message']//span[text()='Preview not available']",
    noPreviewMessageSpan: "//div[@class='no-preview-message']//span",
};

class ContentItemPreviewPanel extends Page {

    get liveViewFrame() {
        return xpath.container + "//iframe";
    }

    get previewButton() {
        return xpath.toolbar + "//button[contains(@id, 'ActionButton') and contains(@class,'icon-newtab')]";
    }

    get emulatorDropdown() {
        return xpath.toolbar + xpath.divEmulatorDropdown;
    }

    get previewWidgetDropdown() {
        return xpath.toolbar + xpath.divPreviewWidgetDropdown;
    }

    get contentStatus() {
        return xpath.toolbar + xpath.status;
    }

    get previewNotAvailableMessage() {
        return xpath.container + xpath.previewNotAvailableSpan;
    }

    get showChangesToolbarButton() {
        return xpath.toolbar + xpath.showChangesButtonToolbar;
    }

    waitForPreviewToolbarNotDisplayed() {
        return this.waitForElementNotDisplayed(xpath.toolbar, appConst.mediumTimeout);
    }

    waitForShowChangesButtonDisplayed() {
        return this.waitForElementDisplayed(this.showChangesToolbarButton, appConst.mediumTimeout);
    }

    waitForShowChangesButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.showChangesToolbarButton, appConst.mediumTimeout);
    }

    async clickOnShowChangesToolbarButton() {
        await this.waitForShowChangesButtonDisplayed();
        await this.clickOnElement(this.showChangesToolbarButton);
    }

    async waitForPreviewNotAvailAbleMessageDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.previewNotAvailableMessage, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_not_available');
            throw new Error(`Preview not available message should be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForPreviewIframeClass(value) {
        let locator = xpath.container + "//iframe";
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(locator, 'class');
            return text === value;
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Iframe should be with class 'application' attribute"});
    }

    // Waits for the image to be displayed in the iframe(Live View)
    async waitForImageElementDisplayed() {
        try {
            let locator = "//img";
            await this.switchToFrame(xpath.container + "//iframe[@class='image']");
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_image_element');
            throw new Error(`Image element should be displayed in the iframe, screenshot: ${screenshot} ` + err);
        }
    }

    async switchToLiveViewFrameByClass(className) {
        return await this.switchToFrame(xpath.container + `//iframe[@class='${className}']`);
    }

    async switchToLiveViewFrame() {
        return await this.switchToFrame(this.liveViewFrame);
    }

    async waitFor404ErrorDisplayed() {
        try {
            let locator = "//h3[text()='404 - Not Found']";
            return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_404');
            throw new Error(`404 error should be displayed in the iframe, screenshot: ${screenshot} ` + err);
        }
    }

    async getJSON_info(keyText) {
        let locator = `//span[@class='key' and contains(.,'${keyText}')]/following-sibling::span[@class='string'][1]`;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    waitForPanelVisible() {
        return this.waitForElementDisplayed(xpath.container, appConst.shortTimeout).catch(err => {
            throw new Error('Content Item preview toolbar was not loaded ' + err);
        });
    }

    // wait for content status cleared
    waitForStatusCleared() {
        let selector = xpath.toolbar + "//div[@class='content-status-wrapper']/span[contains(@class,'status')]";
        return this.waitForElementNotDisplayed(selector, appConst.shortTimeout);
    }

    async getContentStatus() {
        let result = await this.getDisplayedElements(this.contentStatus);
        if (result.length === 0) {
            throw new Error("Content status is not displayed: ");
        }
        return await result[0].getText();
    }

    // Verifies that the element(selector) is displayed in the iframe in Preview Panel
    async waitForElementDisplayedInFrame(selector) {
        try {
            await this.switchToFrame(xpath.container + "//iframe[contains(@src,'admin/site')]");
            let result = await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.switchToParentFrame();
            return result
        } catch (err) {
            await this.switchToParentFrame();
            throw new Error("Preview Panel:" + err);
        }
    }

    async switchToTextFrame() {
        try {
            let locator = xpath.container + "//iframe[contains(@class,'text')]";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.switchToFrame(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_text_frame');
            throw new Error(`Error occurred during switching to the frame, screenshot: ${screenshot} ` + err);
        }
    }

    // Checks that the element(selector) is not displayed in the iframe in Preview Panel
    async waitForElementNotDisplayedInFrame(selector) {
        try {
            await this.switchToFrame(xpath.container + "//iframe[contains(@src,'admin/site')]");
            let result = await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
            await this.switchToParentFrame();
            return result;
        } catch (err) {
            await this.switchToParentFrame();
            return false;
        }
    }

    async clickOnElementInFrame(selector) {
        try {
            await this.switchToFrame(xpath.container + "//iframe[contains(@src,'admin/site')]");
            await this.clickOnElement(selector);
            return await this.switchToParentFrame();
        } catch (err) {
            await this.switchToParentFrame();
            throw new Error("Preview Panel:" + err);
        }
    }

    //  gets a text(*.txt) in the Preview panel
    async getTextInAttachmentPreview() {
        try {
            let textLocator = "//body/pre";
            await this.waitForElementDisplayed(textLocator, appConst.mediumTimeout);
            return await this.getText(textLocator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_attachment_preview');
            throw new Error(`Content Item Preview Panel - screendot:${screenshot} ` + err);
        }
    }

    async getNoPreviewMessage() {
        let locator = xpath.noPreviewMessageSpan;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async get500ErrorText() {
        let locator = "//h1";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async waitForToolbarRoleAttribute(expectedRole) {
        let locator = xpath.toolbar;
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(locator, 'role');
            return text === expectedRole;
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Content Item preview toolbar should be with 'role=toolbar' attribute"});
    }

    // check for Accessibility attributes: aria-label
    async waitForBrowseToolbarAriaLabelAttribute(expectedValue) {
        let locator = xpath.toolbar;
        await this.getBrowser().waitUntil(async () => {
            let text = await this.getAttribute(locator, 'aria-label');
            return text === expectedValue;
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Content Item preview toolbar should contain expected 'aria-label' attribute"});
    }

    // returns the selected option in the 'Emulator dropdown' '100%', '375px', etc.
    async getSelectedOptionInEmulatorDropdown() {
        try {
            let locator = this.emulatorDropdown + lib.H6_DISPLAY_NAME;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_emulator_dropdown');
            throw new Error(`Emulator dropdown - error occurred during getting the selected option, screenshot: ${screenshot} ` + err);
        }
    }

    // Expands the emulator menu:
    async clickOnEmulatorDropdown() {
        await this.waitForElementDisplayed(this.emulatorDropdown, appConst.mediumTimeout);
        return await this.clickOnElement(this.emulatorDropdown);
    }

    // Expands the emulator menu and clicks on a list-item by its name
    async selectOptionInEmulatorDropdown(optionName) {
        await this.waitForElementDisplayed(this.emulatorDropdown, appConst.mediumTimeout);
        await this.clickOnElement(this.emulatorDropdown);
        let optionSelector = this.emulatorDropdown + lib.DROPDOWN_SELECTOR.listItemByDisplayName(optionName);
        await this.waitForElementDisplayed(optionSelector, appConst.mediumTimeout);
        return await this.clickOnElement(optionSelector);
    }

    // Gets the selected option in the 'Preview dropdown' Auto, Media, etc.
    async getSelectedOptionInPreviewWidget() {
        let locator = this.previewWidgetDropdown + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    // Clicks on the dropdown handle in the 'Preview dropdown' then clicks on a list-item by its name
    async selectOptionInPreviewWidget(optionName) {
        try {
            await this.waitForPreviewWidgetDropdownDisplayed();
            await this.clickOnElement(this.previewWidgetDropdown);
            let optionSelector = this.previewWidgetDropdown + lib.DROPDOWN_SELECTOR.listItemByDisplayName(optionName);
            await this.waitForElementDisplayed(optionSelector, appConst.mediumTimeout);
            await this.clickOnElement(optionSelector);
            await this.pause(200);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_widget');
            throw new Error(`Error occurred during selecting option in Preview Widget, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForPreviewWidgetDropdownDisplayed() {
        return await this.waitForElementDisplayed(this.previewWidgetDropdown, appConst.mediumTimeout);
    }

    async waitForPreviewDropdownNotDisplayed() {
        return await this.waitForElementNotDisplayed(this.previewWidgetDropdown, appConst.mediumTimeout);
    }

    async waitForPreviewButtonNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.previewButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_btn');
            throw new Error(`Preview button should not be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    // Wait for the 'Preview' button to be displayed in the Preview Toolbar
    async waitForPreviewButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.previewButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_btn');
            throw new Error(`Preview button should be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnPreviewButton() {
        try {
            await this.waitForPreviewButtonEnabled();
            await this.clickOnElement(this.previewButton);
            return await this.pause(2000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_btn');
            throw new Error(`Error occurred after clicking on 'Preview' button, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForPreviewButtonDisabled() {
        try {
            await this.waitForPreviewButtonDisplayed();
            await this.waitForElementDisabled(this.previewButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_btn_disabled');
            throw new Error(`Preview button should be displayed and disabled, screenshot  : ${screenshot} ` + err);
        }
    }

    async waitForPreviewButtonEnabled() {
        try {
            await this.waitForPreviewButtonDisplayed();
            await this.waitForElementEnabled(this.previewButton, appConst.mediumTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_btn_disabled');
            throw new Error(`Preview button should be enabled, screenshot : ${screenshot} ` + err);
        }
    }

    async waitForToolbarNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(xpath.toolbar, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_toolbar');
            throw new Error(`Preview panel toolbar should not be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    // style for the iframe in the preview panel
    async getPreviewIframeStyle() {
        let locator = xpath.container + "//iframe";
        let classValue = await this.getAttribute(locator, 'style');
        return classValue;
    }

    // return items in the expanded emulator dropdown:
    async getEmulatorResolutions() {
        let locator = xpath.divEmulatorDropdown + xpath.ulEmulatorListBox + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM +
                      lib.H6_DISPLAY_NAME;
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        await this.pause(300);
        return await this.getTextInDisplayedElements(locator);
    }


    // Waits for a text-component is displayed in iframe in Preview Panel
    async waitForTextComponentDisplayed() {
        try {
            let locator = "//section[@data-portal-component-type='text']/p";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_text_component_live_view');
            throw new Error(`Text component is not displayed in Live View in Preview Panel, screenshot: ${screenshot} ` + err);
        }
    }

    // Iframe, get a text from the text component
    async getTextFromTextComponent(index) {
        try {
            let locator = "//section[@data-portal-component-type='text']/p";
            await this.waitForTextComponentDisplayed();
            let txtComponents = await this.findElements(locator);
            return await txtComponents[index].getText();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_live_view');
            throw new Error(`Error during getting a text from the text component in Preview Panel, screenshot: ${screenshot} ` + err);

        }
    }
}

module.exports = ContentItemPreviewPanel;
