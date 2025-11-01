/**
 * Created on 15.02.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('Revert published content spec', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER;

    it(`WHEN new folder has been published THEN Published status should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Add new folder:
            await studioUtils.doAddFolder(FOLDER);
            // 2. reopen the folder and select a language
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            // 3. Open 'Edit Settings' modal dialog:
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await editSettingsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            // 4. Publish the folder
            await contentWizard.clickOnMarkAsReadyButton();
            await studioUtils.doPublish();
            await contentWizard.clickOnPageEditorToggler();
            // "Published status should be in Wizard"
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.PUBLISHED);
        });

    it(`GIVEN published folder is selected WHEN the previous 'Edited' version has been restored THEN 'Modified' status should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            // 1. Open the folder and revert the previous version:
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            await contentWizard.openVersionsHistoryPanel();
            // 2. Revert the latest 'Edited' version:
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await wizardVersionsWidget.clickOnRestoreButton();
            // 3. Verify the message:
            let actualMessage = await contentWizard.waitForNotificationMessage();
            assert.ok(actualMessage.includes(appConst.NOTIFICATION_MESSAGES.CONTENT_REVERTED),
                'Expected notification message should appear');
            // 4. Open Page Editor with Preview Widget, Verify that status gets Modified
            await contentWizard.clickOnPageEditorToggler();
            let status = await contentWizard.getContentStatus();
            assert.equal(status, appConst.CONTENT_STATUS.MODIFIED, `'Modified' status should be in Wizard`);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
