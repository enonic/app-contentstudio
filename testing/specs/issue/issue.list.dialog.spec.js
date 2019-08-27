/**
 * Created on 05.01.2017.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');

describe('issue.list.dialog.spec: Issue List modal Dialog specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`WHEN 'Issues List Dialog' has been opened THEN required control elements should be present`,
        async () => {
            let issueListDialog = new IssueListDialog();
            await studioUtils.openIssuesListDialog();
            let title = await issueListDialog.getTitle();
            assert.strictEqual(title, 'Issues');
            let showClosedIssuesLink = await issueListDialog.isShowClosedIssuesButtonVisible();
            assert.isTrue(showClosedIssuesLink, "'Show closed Issues' link should be present");

            let pubReqTab = await issueListDialog.isPublishRequestsTabDisplayed();
            assert.isTrue(pubReqTab, "`Publish Requests` tab should be displayed");

            let allIssuesTab = await issueListDialog.isAllIssuesTabDisplayed();
            assert.isTrue(allIssuesTab, "`All Issues` tab should be displayed");
            let issuesTab = await issueListDialog.isIssuesTabDisplayed();
            assert.isTrue(issuesTab, "`Issues` tab should be displayed");

            let result = await issueListDialog.getAssignedSelectedOption();
            assert.isTrue(result.includes(`Assigned by Me`), '`Assigned by Me` option should be selected in Show combobox')

        });

    it(`GIVEN 'Issues List Dialog' has been opened WHEN Issues tab has been clicked THEN 'New Issue...' button should be present`,
        async () => {
            let issueListDialog = new IssueListDialog();
            await studioUtils.openIssuesListDialog();
            //Issues tab has been clicked:
            await issueListDialog.clickOnIssuesTab();

            let isNewButtonDisplayed = await issueListDialog.isNewIssueButtonVisible();
            assert.isTrue(isNewButtonDisplayed, "`New Issue...` button should be displayed");
        });


    it(`GIVEN 'Issues List Dialog' is opened WHEN 'Show closed issues' button has been clicked THEN 'Hide closed issues' button is getting visible`,
        () => {
            let issueListDialog = new IssueListDialog();
            return studioUtils.openIssuesListDialog().then(() => {
                return issueListDialog.clickOnShowClosedIssuesButton();
            }).then(() => {
                return assert.eventually.isTrue(issueListDialog.waitForHideClosedIssuesButtonVisible(),
                    "`Hide closed issues` button should be displayed");
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
})
;
