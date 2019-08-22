/**
 * Created on 19.08.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const RequestContentPublishDialog = require('../../page_objects/issue/request.content.publish.dialog');
const IssueDetailsPublishRequestTab = require('../../page_objects/issue/issue.details.dialog.publish.request.tab');

describe('wizard.publish.menu.spec - request publish dialog - add items in the dialog and check `Publish Now` button', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER1;

    // verifies https://github.com/enonic/app-contentstudio/issues/723  Publish Request dialog - Publish button should be disabled when 'work in progress' content has been added
    // https://github.com/enonic/app-contentstudio/issues/816 - Request tab is not loaded after creating new request
    it(`GIVEN new publish request is created AND Issue Details Dialog is opened  WHEN one 'Work in progress' has been added  THEN 'Publish Now' button gets disabled on the modal dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let publishRequestTab = new IssueDetailsPublishRequestTab();
            let requestContentPublishDialog = new RequestContentPublishDialog();
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            TEST_FOLDER1 = contentBuilder.buildFolder(displayName1);
            //Add `Work in progress` folder:
            await studioUtils.doAddFolder(TEST_FOLDER1);

            //Open wizard for the second folder, type a name and Request Publish dialog :
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(displayName2);
            //Create a new publish request:
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await requestContentPublishDialog.clickOnNextButton();
            await requestContentPublishDialog.typeInChangesInput("my changes");
            await requestContentPublishDialog.clickOnCreateRequestButton();

            //(app-contentstudio/issues/816) Wait for the requests-tab is loaded then do add a work-in-progress-folder:
            await publishRequestTab.waitForTabLoaded();
            await publishRequestTab.doAddItem(displayName1);

            await publishRequestTab.waitForPublishNowButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
