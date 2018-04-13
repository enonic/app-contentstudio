/**
 * Created on 05.01.2017.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const issueListDialog = require('../page_objects/issue/issue.list.dialog');


describe('issue.list.dialog.spec: Issue List Dialog specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`WHEN 'Issues List Dialog' has been opened THEN required control elements should be present`,
        () => {
            return studioUtils.openIssuesListDialog().then(()=> {
                return issueListDialog.getTitle();
            }).then((title)=> {
                assert.strictEqual(title, 'Publishing Issues');
            }).then(()=> {
                return assert.eventually.isTrue(issueListDialog.isShowClosedIssuesLinkVisible(),
                    "`Show Closed Issues ` link should be displayed");
            }).then(()=> {
                return assert.eventually.isTrue(issueListDialog.isNewIssueButtonVisible(),
                    "`New Issue...` button should be displayed");
            }).then(()=> {
                return assert.eventually.isTrue(issueListDialog.isMyOpenedIssuesCheckboxVisible(), '`My Issues` checkbox should be present')
            })
        });

    it(`GIVEN 'Issues List Dialog' is opened WHEN 'Show closed issues' has been clicked THEN 'Show open issues' link is getting visible`,
        () => {
            return studioUtils.openIssuesListDialog().then(()=> {
                return issueListDialog.clickOnShowClosedIssuesLink();
            }).then((title)=> {
                return assert.eventually.isTrue(issueListDialog.waitForShowOpenIssuesLinkVisible(),
                    "`Show open issues` link should be displayed");
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification starting: ' + this.title);
    });
});
