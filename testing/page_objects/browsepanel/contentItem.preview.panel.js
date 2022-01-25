/**
 * Created on 20/06/2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const {XPATH} = require('../users/wizard.panel');

const xpath = {
    container: "//div[contains(@id,'ContentItemPreviewPanel')]",
    toolbar: `//div[contains(@id,'ContentItemPreviewToolbar')]`,
    status: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'status')]`,
    author: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'author')]`,
    issueMenuButton: `//div[contains(@id,'MenuButton')]`,
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

    waitForPreviewNotAvailAbleMessageDisplayed() {
        return this.waitForElementDisplayed(this.previewNotAvailableMessage, appConst.mediumTimeout);
    }

    waitForImageDisplayed() {
        let locator = xpath.container + "//img";
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    waitForPanelVisible() {
        return this.waitForElementDisplayed(xpath.container, appConst.shortTimeout).catch(err => {
            throw new Error('Content Item preview toolbar was not loaded in ' + appConst.shortTimeout);
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
            throw new Error('error when clicking on the dropdown handle ' + err);
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
            this.saveScreenshot("err_issue_menu_item");
            throw new Error("Menu item was not found! " + issueName + "  " + err);
        }
    }

    //When issue is closed, this button gets not visible:
    async waitForIssueMenuButtonNotVisible() {
        try {
            let selector = xpath.toolbar + `//div[contains(@id,'MenuButton') and descendant::span[contains(@class,'icon-issue')]]//button`;
            await this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot("err_preview_toolbar_issue_icon");
            throw new Error("Issue icon still visible in the toolbar " + err);
        }
    }

    async clickOnIssueMenuButton() {
        try {
            let selector = xpath.toolbar + xpath.issueMenuButton;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(400);
        } catch (err) {
            throw new Error('issue menu button was not found!  ' + err);
        }
    }

    async clickOnIssueButtonByName(issueName) {
        try {
            let locator = xpath.toolbar + xpath.issueMenuButtonByName(issueName);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(400);
        } catch (err) {
            throw new Error('issue menu button was not found!  ' + err);
        }
    }

    async getContentStatus() {
        let result = await this.getDisplayedElements(this.contentStatus);
        return await result[0].getText(this.contentStatus);
    }

    async getContentAuthor() {
        let result = await this.getDisplayedElements(this.author);
        return await result[0].getText();
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
            return result
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

    //switches to iframe and gets text in the panel
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
        return await this.getText(locator);
    }
}

module.exports = ContentItemPreviewPanel;
