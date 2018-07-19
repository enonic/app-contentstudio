/**
 * Created on 13.07.2018.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const issueListDialog = require('../../page_objects/issue/issue.list.dialog');
const createIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const issueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const issueDetailsDialogItemsTab = require('../../page_objects/issue/issue.details.items.tab');
const contentBuilder = require("../../libs/content.builder");
const contentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');

describe(
    'close.issue.with.item.spec: issue has an item, the issue has been closed, menu-button should disappear on the toolbar( the item is selected in the grid)',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let issueTitle = appConstant.generateRandomName('issue');

        let TEST_FOLDER;
        it(`Precondition: create a folder and create new issue`,
            () => {
                let displayName = contentBuilder.generateRandomName('folder');
                TEST_FOLDER = contentBuilder.buildFolder(displayName);
                return studioUtils.doAddFolder(TEST_FOLDER).then(() => {
                    return studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
                }).then(() => {
                    return studioUtils.openPublishMenuAndClickOnCreateIssue();
                }).then(() => {
                    return createIssueDialog.typeTitle(issueTitle);
                }).then(result => {
                    return createIssueDialog.clickOnCreateIssueButton();
                }).then(() => {
                    return issueDetailsDialog.waitForDialogLoaded();
                })
            });

        it(`GIVEN content is selected in grid AND 'Issue Details Dialog' is opened(click on issue-menu-button) WHEN 'Close Issue' button has been pressed AND modal dialog closed THEN menu button should not be visible`,
            () => {
                return studioUtils.findAndSelectItem(TEST_FOLDER.displayName).then(() => {
                    return contentItemPreviewPanel.clickOnIssueMenuButton();
                }).then(() => {
                    return issueDetailsDialog.waitForDialogLoaded();
                }).then(() => {
                    return issueDetailsDialog.clickOnCloseIssueButton();
                }).then(() => {
                    return issueDetailsDialog.clickOnCancelTopButton();
                }).then(() => {
                    return assert.eventually.isTrue(contentItemPreviewPanel.waitForIssueMenuButtonNotVisible(),
                        'issue-menu button is getting not visible on the preview toolbar, (when the content is selected)');
                })
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification is starting: ' + this.title);
        });
    });
