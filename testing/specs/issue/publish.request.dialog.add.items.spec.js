/**
 * Created on 19.08.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const PublishRequestDetailsDialog = require('../../page_objects/issue/publish.request.details.dialog');

describe('publish.request.dialog.add.items.spec - request publish dialog - check `Publish Now` button', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER1;

    // verifies https://github.com/enonic/app-contentstudio/issues/723  Publish Request dialog - Publish button should be disabled when 'work in progress' content has been added
    // https://github.com/enonic/app-contentstudio/issues/816 - Request tab is not loaded after creating new request
    it(`GIVEN new publish request is created AND Issue Details Dialog is opened  WHEN one 'Work in progress' has been added  THEN 'Publish Now' button gets disabled in the modal dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let publishRequestDetailsDialog = new PublishRequestDetailsDialog();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            TEST_FOLDER1 = contentBuilder.buildFolder(displayName1);
            //1. Add `Work in progress` folder:
            await studioUtils.doAddFolder(TEST_FOLDER1);

            //2. Open wizard for the second folder, type a name and Request Publish dialog :
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(displayName2);
            await contentWizard.clickOnMarkAsReadyButton();
            //3. Open publish menu in the wizard and create new publish request:
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            studioUtils.saveScreenshot("pub_req_step1");
            await createRequestPublishDialog.clickOnNextButton();
            studioUtils.saveScreenshot("pub_req_step2");
            await createRequestPublishDialog.typeInChangesInput("my changes");
            studioUtils.saveScreenshot("pub_req_step3");
            await createRequestPublishDialog.clickOnCreateRequestButton();
            studioUtils.saveScreenshot("pub_req_step4");
            //4. Verify that Issue Details dialog closes after creating a publishing request:
            await publishRequestDetailsDialog.waitForClosed();

            //5. Reopen Issue Details dialog and verify control elements:
            await contentWizard.clickOnOpenRequestButton();
            //(app-contentstudio/issues/816) Wait for the requests-tab is loaded then do add a work-in-progress-folder:
            await publishRequestDetailsDialog.waitForTabLoaded();
            await publishRequestDetailsDialog.pause(500);
            //6. Add 'Work in Progress' folder:
            await publishRequestDetailsDialog.doAddItem(TEST_FOLDER1.displayName);
            studioUtils.saveScreenshot("request_publish_button_disabled");
            //7. 'Publish Now' button gets disabled:(one of the items is 'Work in Progress')
            await publishRequestDetailsDialog.waitForPublishNowButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
