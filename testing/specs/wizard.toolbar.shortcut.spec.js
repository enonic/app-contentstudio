/**
 * Created on 17.05.2018.
 * verifies:https://github.com/enonic/app-contentstudio/issues/127  (shortcut for Publish button does not work)
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ContentPublishDialog = require('../page_objects/content.publish.dialog');

describe('Wizard toolbar - shortcut spec`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let displayName;
    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+s' has been pressed THEN folder should be saved`, () => {
        let contentWizard = new ContentWizard();
        displayName = contentBuilder.generateRandomName('folder');
        return studioUtils.openContentWizard(appConstant.contentTypes.FOLDER).then(() => {
            return contentWizard.typeDisplayName(displayName);
        }).then(()=>{
            return contentWizard.pause(1000);
        }).then(() => {
            return contentWizard.hotKeySave();
        }).then(result => {
            return contentWizard.waitForExpectedNotificationMessage(appConstant.itemSavedNotificationMessage(displayName));
        })
    });

    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Delete' have been pressed THEN 'Delete Dialog' should appear`, () => {
        let deleteContentDialog = new DeleteContentDialog();
        return studioUtils.selectAndOpenContentInWizard(displayName).then(() => {
            let contentWizard = new ContentWizard();
            return contentWizard.hotKeyDelete();
        }).then(() => {
            return deleteContentDialog.waitForDialogOpened();
        }).then(result => {
            studioUtils.saveScreenshot('wizard_shortcut_delete');
            assert.isTrue(result, 'Delete Dialog should be present');
        })
    });
    //verifies:https://github.com/enonic/app-contentstudio/issues/127
    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Alt+p' have been pressed THEN 'Publish Dialog' should appear`, () => {
        let contentWizard = new ContentWizard();
        let contentPublishDialog = new ContentPublishDialog();
        return studioUtils.selectAndOpenContentInWizard(displayName).then(() => {
            return contentWizard.hotKeyPublish();
        }).then(() => {
            return contentPublishDialog.waitForDialogOpened();
        }).then(result => {
            studioUtils.saveScreenshot('wizard_shortcut_publish');
            assert.isTrue(result, 'Publish Dialog should be present');
        })
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
