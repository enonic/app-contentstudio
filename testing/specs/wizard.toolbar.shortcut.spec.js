/**
 * Created on 17.05.2018.
 */
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ContentPublishDialog = require('../page_objects/content.publish.dialog');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const appConst = require('../libs/app_const');

describe('Wizard toolbar - shortcut spec', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let DISPLAY_NAME;

    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+s' has been pressed THEN folder should be saved`,
        async () => {
            let contentWizard = new ContentWizard();
            DISPLAY_NAME = contentBuilder.generateRandomName('folder');
            // 1. Open new wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            await contentWizard.pause(1000);
            // 2. Press 'Ctrl+S'
            await contentWizard.hotKeySave();
            // 3. Verify the notification message:
            await contentWizard.waitForExpectedNotificationMessage(appConst.itemSavedNotificationMessage(DISPLAY_NAME));
        });

    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Delete' have been pressed THEN 'Delete Dialog' should appear`,
        async () => {
            let deleteContentDialog = new DeleteContentDialog();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            let contentWizard = new ContentWizard();
            // 2. Press 'Ctrl+Delete'
            await contentWizard.hotKeyDelete();
            // 3. Verify that Delete Content dialog loaded:
            await studioUtils.saveScreenshot('wizard_shortcut_delete');
            await deleteContentDialog.waitForDialogOpened();
        });

    // verifies:https://github.com/enonic/app-contentstudio/issues/127
    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Alt+p' have been pressed THEN 'Publish Dialog' should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Press 'Ctrl+Alt+p'
            await contentWizard.hotKeyPublish();
            // 3. Verify that Publish Content dialog loaded:
            await contentPublishDialog.waitForDialogOpened();
        });

    it(`WHEN existing folder has been opened THEN role attribute should be set to 'role' for wizard-toolbar div`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open the existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Verify that role attribute is set to 'role' for wizard-toolbar div:
            await contentWizard.waitForToolbarRoleAttribute('toolbar');
        });

    it.skip(`GIVEN folder-wizard is opened WHEN 'Alt+w' have been pressed THEN wizard should be closed and grid is loaded`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            await contentWizard.hotKeyCloseWizard();
            await contentBrowsePanel.waitForGridLoaded();
        });

    it(`GIVEN folder-wizard is opened WHEN 'Ctrl+Enter' have been pressed THEN the content should be should be saved then closed AND grid is loaded`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open existing folder:
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. Open Edit Details modal dialog and select the language:
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            // 3. Press 'Ctrl+Enter
            await contentWizard.hotKeySaveAndCloseWizard();
            await contentBrowsePanel.waitForGridLoaded();
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

    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
