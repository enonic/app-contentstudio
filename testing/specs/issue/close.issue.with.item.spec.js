/**
 * Created on 13.07.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('close.issue.with.item.spec: close an issue and verify control elements on the ItemPreview Panel', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('issue');
    let TEST_FOLDER;

    //verifies https://github.com/enonic/app-contentstudio/issues/356
    //Endless spinner after clicking on Create Issue button
    it(`GIVEN user just is 'logged in' AND no selections in the grid WHEN 'Create Issue' button has been pressed  THEN Create Issue dialog should appear`,
        () => {
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            return contentBrowsePanel.clickOnCreateIssueButton().then(() => {
                return createIssueDialog.waitForDialogLoaded();
            }).then(() => {
                return createIssueDialog.waitForSpinnerNotVisible(appConstant.TIMEOUT_5);
            })
        });

    it(`Precondition: new published-folder and new issue have been created`,
        () => {
            let createIssueDialog = new CreateIssueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let issueDetailsDialog = new IssueDetailsDialog();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            return studioUtils.doAddReadyFolder(TEST_FOLDER).then(() => {
                return studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            }).then(() => {
                // Publish button is getting visible, because the content is 'New' and valid
                return contentBrowsePanel.waitForPublishButtonVisible();
            }).then(() => {
                //expand the menu and open 'Create Issue' dialog
                return contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            }).then(() => {
                return createIssueDialog.typeTitle(issueTitle);
            }).then(result => {
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            })
        });

    it(`GIVEN content is selected in grid AND 'Issue Details Dialog' is opened(click on issue-menu-button) WHEN 'Close Issue' button has been pressed THEN issue-menu button gets not visible`,
        () => {
            let issueDetailsDialog = new IssueDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            return studioUtils.findAndSelectItem(TEST_FOLDER.displayName).then(() => {
                return contentItemPreviewPanel.clickOnIssueMenuButton();
            }).then(() => {
                return issueDetailsDialog.waitForDialogOpened();
            }).then(() => {
                //the issue has been closed
                return issueDetailsDialog.clickOnCloseIssueButton();
            }).then(() => {
                //modal dialog has been closed
                return issueDetailsDialog.clickOnCancelTopButton();
            }).then(() => {
                return assert.eventually.isTrue(contentItemPreviewPanel.waitForIssueMenuButtonNotVisible(),
                    'issue-menu button is getting not visible on the preview toolbar, (the content is selected)');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
