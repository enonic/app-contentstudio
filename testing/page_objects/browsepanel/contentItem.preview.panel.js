/**
 * Created on 20/06/2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const xpath = {
    container: "//div[contains(@id,'ContentItemPreviewPanel')]",
    toolbar: `//div[contains(@id,'ContentItemPreviewToolbar')]`,
    status: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'status')]`,
    author: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'author')]`,
    issueMenuButton: `//div[contains(@id,'MenuButton')]`,
    showChangesButtonToolbar: "//button[contains(@class,'show-changes') and @title='Show changes']",
    previewNotAvailableSpan: "//div[@class='no-preview-message']//span[text()='Preview not available']",
    issueMenuItemByName:
        name => `//ul[contains(@id,'Menu')]/li[contains(@id,'MenuItem') and contains(.,'${name}')]`,
    issueMenuButtonByName:
        name => `//div[contains(@id,'MenuButton') and descendant::span[contains(.,'${name}')]]`,
};

class ContentItemPreviewPanel extends Page {

    get issueDropdownHandle() {
        return xpath.toolbar + xpath.issueMenuButton + lib.DROP_DOWN_HANDLE;
    }

    get contentStatus() {
        return xpath.toolbar + xpath.status;
    }

    get previewNotAvailableMessage() {
        return xpath.container + xpath.previewNotAvailableSpan;
    }

    get author() {
        return xpath.toolbar + xpath.author;
    }

    get showChangesToolbarButton() {
        return xpath.toolbar + xpath.showChangesButtonToolbar;
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

    waitForPreviewNotAvailAbleMessageDisplayed() {
        return this.waitForElementDisplayed(this.previewNotAvailableMessage, appConst.mediumTimeout);
    }

    async waitForImageDisplayed() {
        let locator = xpath.container + "//img";
        return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    waitForPanelVisible() {
        return this.waitForElementDisplayed(xpath.container, appConst.shortTimeout).catch(err => {
            throw new Error('Content Item preview toolbar was not loaded ' + err);
        });
    }

    //wait for content status cleared
    waitForStatusCleared() {
        let selector = xpath.toolbar + "//div[@class='content-status-wrapper']/span[contains(@class,'status')]";
        return this.waitForElementNotDisplayed(selector, appConst.shortTimeout);
    }

    waitForAuthorCleared() {
        let selector = xpath.toolbar + "//div[@class='content-status-wrapper']/span[contains(@class,'author')]";
        return this.waitForElementNotDisplayed(selector, appConst.shortTimeout);
    }

    async clickOnIssueMenuDropDownHandle() {
        try {
            await this.waitForIssueDropDownHandleDisplayed();
            return await this.clickOnElement(this.issueDropdownHandle);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_issue_dropdown');
            throw new Error(`error after clicking on the dropdown handle , screenshot: ${screenshot}` + err);
        }
    }

    waitForIssueDropDownHandleDisplayed() {
        return this.waitForElementDisplayed(this.issueDropdownHandle, appConst.shortTimeout);
    }

    waitForIssueDropDownHandleNotDisplayed() {
        return this.waitForElementNotDisplayed(this.issueDropdownHandle, appConst.shortTimeout).catch(err => {
            throw new Error('Item Preview Toolbar - dropdown handle should not be displayed !  ' + err);
        });
    }

    async clickOnIssueMenuItem(issueName) {
        try {
            let selector = xpath.toolbar + xpath.issueMenuItemByName(issueName);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.clickOnElement(selector);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_issue_menu_item');
            throw new Error(`Menu item was not found! screenshot: ${screenshot} ` + err);
        }
    }

    // When issue is closed, this button gets not visible:
    async waitForIssueMenuButtonNotVisible() {
        try {
            let selector = xpath.toolbar + `//div[contains(@id,'MenuButton') and descendant::span[contains(@class,'icon-issue')]]//button`;
            await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_toolbar_issue_icon');
            throw new Error(`Issue icon should not be visible in the toolbar, screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnIssueMenuButton() {
        try {
            let selector = xpath.toolbar + xpath.issueMenuButton;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_toolbar_issue_icon');
            throw new Error(`Issue menu button was not found! screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnIssueButtonByName(issueName) {
        try {
            let locator = xpath.toolbar + xpath.issueMenuButtonByName(issueName);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_preview_toolbar_issue_icon');
            throw new Error(`Issue menu button was not found! screenshot: ${screenshot} ` + err);
        }
    }

    async getContentStatus() {
        let result = await this.getDisplayedElements(this.contentStatus);
        if (result.length === 0) {
            throw new Error("Content status is not displayed: ");
        }
        return await result[0].getText();
    }

    async waitForAuthorNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.author, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_itempreview_author"));
            throw new Error("Author should not be displayed in the item preview toolbar " + err);
        }
    }

    async getIssueNameInMenuButton() {
        let selector = xpath.toolbar + xpath.issueMenuButton + '//button/span';
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        return await this.getText(selector);
    }

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

    waitForIssueNameInMenuButton(issueName) {
        let selector = xpath.toolbar + xpath.issueMenuButtonByName(issueName);
        return this.waitUntilDisplayed(selector, appConst.shortTimeout);
    }

    // switches to iframe and gets text in the panel
    async getTextInAttachmentPreview() {
        try {
            let attachmentFrame = "//iframe[contains(@src,'/admin/rest-v2/cs/cms/default/content/content/media/')]";
            await this.switchToFrame(attachmentFrame);
            return await this.getText("//body/pre");
        } catch (err) {
            throw new Error("Content Item Preview Panel - " + err);
        }
    }

    async getNoPreviewMessage() {
        let locator = xpath.container + "//div[@class='no-preview-message']//span";
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
            let text = await this.getAttribute(locator, "aria-label");
            return text === expectedValue;
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Content Item preview toolbar should contain expected 'aria-label' attribute"});
    }
}

module.exports = ContentItemPreviewPanel;
