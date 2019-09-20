/**
 * Created on 20/06/2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const xpath = {
    toolbar: `//div[contains(@id,'ContentItemPreviewToolbar')]`,
    status: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'status')]`,
    author: `//div[contains(@class,'content-status-wrapper')]/span[contains(@class,'author')]`,
    issueMenuButton: `//div[contains(@id,'MenuButton')]`,
    issueMenuItemByName:
        name => `//ul[contains(@id,'Menu')]/li[contains(@id,'MenuItem')]/i[contains(.,'${name}')]`,
    issueMenuButtonByName:
        name => `//div[contains(@id,'MenuButton') and descendant::i[contains(.,'${name}')]]`,
};

class ContentItemPreviewPanel extends Page {

    get issueDropdownHandle() {
        return xpath.toolbar + xpath.issueMenuButton + lib.DROP_DOWN_HANDLE;
    }

    get contentStatus() {
        return xpath.toolbar + xpath.status;
    }

    get author() {
        return xpath.toolbar + xpath.author;
    }

    waitForPanelVisible() {
        return this.waitForElementDisplayed(xpath.container, appConst.TIMEOUT_2).catch(err => {
            throw new Error('Content Item preview toolbar was not loaded in ' + appConst.TIMEOUT_2);
        });
    }

    //wait for content status cleared
    waitForStatusCleared() {
        let selector = xpath.toolbar + "//div[@class='content-status-wrapper']/span[contains(@class,'status')]";
        return this.waitForElementNotDisplayed(selector, appConst.TIMEOUT_2);
    }

    waitForAuthorCleared() {
        let selector = xpath.toolbar + "//div[@class='content-status-wrapper']/span[contains(@class,'author')]";
        return this.waitForElementNotDisplayed(selector, appConst.TIMEOUT_2);
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
        return this.waitForElementDisplayed(this.issueDropdownHandle, appConst.TIMEOUT_2);
    }

    waitForIssueDropDownHandleNotDisplayed() {
        return this.waitForElementNotDisplayed(this.issueDropdownHandle, appConst.TIMEOUT_2).catch(err => {
            throw new Error('Item Preview Toolbar - dropdown handle should not be displayed !  ' + err);

        });
    }

    async clickOnIssueMenuItem(issueName) {
        try {
            let selector = xpath.issueMenuItemByName(issueName);
            await this.waitForElementDisplayed(selector, appConst.TIMEOUT_3);
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
            await this.waitForElementNotDisplayed(selector, appConst.TIMEOUT_3);
        } catch (err) {
            this.saveScreenshot("err_preview_toolbar_issue_icon");
            throw new Error("Issue icon still visible in the toolbar " + err);
        }
    }

    async clickOnIssueMenuButton() {
        try {
            let selector = xpath.toolbar + xpath.issueMenuButton + "//button";
            await this.waitForElementDisplayed(xpath.toolbar + xpath.issueMenuButton, appConst.TIMEOUT_3);
            return await this.clickOnElement(xpath.toolbar + xpath.issueMenuButton);
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

    getIssueNameInMenuButton() {
        let selector = xpath.toolbar + xpath.issueMenuButton + '//span/i';
        return this.getText(selector);
    }

    waitForIssueNameInMenuButton(issueName) {
        let selector = xpath.toolbar + xpath.issueMenuButtonByName(issueName);
        return this.waitUntilDisplayed(selector, appConst.TIMEOUT_2);
    }

    //switches to iframe and gets text in the panel
    async getTextInAttachmentPreview() {
        try {
            let attachmentFrame = "//iframe[contains(@src,'/admin/rest/content/media/')]";
            await this.switchToFrame(attachmentFrame);
            return await this.getText("//body/pre");
        } catch (err) {
            throw new Error("Content Item Preview Panel - " + err);
        }
    }
};
module.exports = ContentItemPreviewPanel;