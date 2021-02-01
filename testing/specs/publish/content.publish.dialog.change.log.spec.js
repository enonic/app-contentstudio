/**
 * Created on 16.09.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('content.publish.dialog.change.log.spec - open publish modal dialog and type a text in the change log input', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let FOLDER1_NAME;
    let TEST_TEXT = "Hello world";

    it(`GIVEN Publish Dialog is opened WHEN a text has been typed in the change log THEN expected text should be present in the dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            FOLDER1_NAME = contentBuilder.generateRandomName('folder');
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER1_NAME);
            //Publish... menu item has been clicked:
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentWizard.pause(1000);

            //type a text in the Change Log input
            await contentPublishDialog.typeTextInChangeLog(TEST_TEXT);
            studioUtils.saveScreenshot("text_in_change_log");
            //Check that text:
            let actualText = await contentPublishDialog.getTextInChangeLog();
            assert.equal(actualText, TEST_TEXT, "Change log input - actual and expected text should be equal");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
