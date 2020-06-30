/**
 * Created on 17.05.2018.
 * verifies:https://github.com/enonic/app-contentstudio/issues/127  (shortcut for Publish button does not work)
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ContentPublishDialog = require('../page_objects/content.publish.dialog');
const SettingsStepForm = require('../page_objects/wizardpanel/settings.wizard.step.form');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');

describe('Wizard toolbar - shortcut spec`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let DISPLAY_NAME;

    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+s' has been pressed THEN folder should be saved`, async () => {
        let contentWizard = new ContentWizard();
        DISPLAY_NAME = contentBuilder.generateRandomName('folder');
        //1. Open new wizard:
        await studioUtils.openContentWizard(appConstant.contentTypes.FOLDER);
        await contentWizard.typeDisplayName(DISPLAY_NAME);
        await contentWizard.pause(1000);
        //2. Press 'Ctrl+S'
        await contentWizard.hotKeySave();
        //3. Verify the notification message:
        await contentWizard.waitForExpectedNotificationMessage(appConstant.itemSavedNotificationMessage(DISPLAY_NAME));
    });

    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Delete' have been pressed THEN 'Delete Dialog' should appear`, async () => {
        let deleteContentDialog = new DeleteContentDialog();
        //1. Open existing folder:
        await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
        let contentWizard = new ContentWizard();
        //2. Press 'Ctrl+Delete'
        await contentWizard.hotKeyDelete();
        //3. Verify that Delete Content dialog loaded:
        studioUtils.saveScreenshot('wizard_shortcut_delete');
        await deleteContentDialog.waitForDialogOpened();
    });

    //verifies:https://github.com/enonic/app-contentstudio/issues/127
    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Alt+p' have been pressed THEN 'Publish Dialog' should appear`, async () => {
        let contentWizard = new ContentWizard();
        let contentPublishDialog = new ContentPublishDialog();
        //1. Open existing folder:
        await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
        //2. Press 'Ctrl+Alt+p'
        await contentWizard.hotKeyPublish();
        //3. Verify that Publish Content dialog loaded:
        await contentPublishDialog.waitForDialogOpened();
    });

    it(`GIVEN folder-wizard is opened WHEN 'Alt+w' have been pressed THEN wizard should be closed and grid is loaded`, async () => {
        let contentWizard = new ContentWizard();
        let contentBrowsePanel = new ContentBrowsePanel();
        //1. Open existing folder:
        await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
        await contentWizard.hotKeyCloseWizard();
        await contentBrowsePanel.waitForGridLoaded(appConstant.shortTimeout);
    });

    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Enter' have been pressed THEN the content should be should be saved then closed AND grid is loaded`,
        async () => {
            let contentWizard = new ContentWizard();
            let settingsStepForm = new SettingsStepForm();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            //2. Select a language:
            await settingsStepForm.filterOptionsAndSelectLanguage('English (en)');
            //3. Press 'Ctrl+Enter
            await contentWizard.hotKeySaveAndCloseWizard();
            await contentBrowsePanel.waitForGridLoaded(appConstant.shortTimeout);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => {
        let contentWizard = new ContentWizard();
        return contentWizard.isAlertPresent().then(result => {
            if (result) {
                return contentWizard.alertAccept();
            }
        }).then(() => {
            return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        })
    });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
