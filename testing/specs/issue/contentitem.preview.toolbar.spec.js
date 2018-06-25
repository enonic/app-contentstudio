/**
 * Created on 21.06.2018.
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

describe('contentItem.preview.toolbar.spec: create an issue and check the toolbar', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let issueTitle = appConstant.generateRandomName('issue');
    let secondIssueTitle = appConstant.generateRandomName('issue');

    let TEST_FOLDER;
    it(`GIVEN folder has been created WHEN the folder is selected THEN 'New' status should be displayed on the toolbar`,
        () => {
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            return studioUtils.doAddFolder(TEST_FOLDER).then(() => {
                return studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            }).then(() => {
                return expect(contentItemPreviewPanel.getContentStatus()).to.eventually.equal('New');
            }).then(() => {
                return expect(contentItemPreviewPanel.getContentAuthor()).to.eventually.equal('by su');
            });
        });

    it(`GIVEN existing folder WHEN the folder is selected and published THEN 'Published' status should be displayed on the toolbar`,
        () => {
            return studioUtils.findAndSelectItem(TEST_FOLDER.displayName).then(() => {
                return studioUtils.doPublish();
            }).then(() => {
                return expect(contentItemPreviewPanel.getContentStatus()).to.eventually.equal('Published');
            });
        });

    it(`GIVEN existing folder is selected WHEN new issue has been created THEN menu button with the issue-name should appear`,
        () => {
            return studioUtils.findAndSelectItem(TEST_FOLDER.displayName).then(() => {
                return studioUtils.openPublishMenuAndClickOnCreateIssue();
            }).then(() => {
                return createIssueDialog.typeTitle(issueTitle);
            }).then(result => {
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(() => {
                return issueDetailsDialog.clickOnCancelTopButton();
            }).then(() => {
                return contentItemPreviewPanel.getIssueNameOnMenuButton();
            }).then(result => {
                assert.isTrue(result == issueTitle);
            })
        });

    it(`GIVEN existing folder is selected WHEN the second issue has been created THEN issue-name should be updated in the menu button`,
        () => {
            return studioUtils.findAndSelectItem(TEST_FOLDER.displayName).then(() => {
                return studioUtils.openPublishMenuAndClickOnCreateIssue();
            }).then(() => {
                return createIssueDialog.typeTitle(secondIssueTitle);
            }).then(result => {
                return createIssueDialog.clickOnCreateIssueButton();
            }).then(() => {
                return issueDetailsDialog.clickOnCancelTopButton();
            }).then(() => {
                return contentItemPreviewPanel.getIssueNameOnMenuButton();
            }).then(result => {
                assert.isTrue(result == secondIssueTitle);
            })
        });

    it(`GIVEN existing folder is selected WHEN issue menu button has been clicked THEN 'IssueDetails' modal dialog should appear`,
        () => {
            return studioUtils.findAndSelectItem(TEST_FOLDER.displayName).then(() => {
                return contentItemPreviewPanel.clickOnIssueMenuButton();
            }).then(() => {
                return issueDetailsDialog.waitForDialogLoaded();
            }).then(() => {
                return issueDetailsDialog.getIssueName();
            }).then(result => {
                studioUtils.saveScreenshot("issue_menu_button_clicked");
                assert.isTrue(result == secondIssueTitle);
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
