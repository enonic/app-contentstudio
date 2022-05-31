/**
 * Created on 09.09.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');

describe('folder.wizard.toolbar.spec: tests for toolbar in folder wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let FOLDER_1_NAME = appConst.generateRandomName("folder");

    it(`GIVEN folder-wizard is opened WHEN name input is empty THEN all buttons have expected state`, async () => {
        let contentWizard = new ContentWizard();
        //1. Open new folder-wizard
        await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizard.waitForArchiveButtonEnabled();
        //2. 'Save' button should be disabled (name input is empty)
        await contentWizard.waitForSaveButtonDisabled();
        //3 'Create Task' is Default action
        await contentWizard.waitForCreateTaskButtonDisplayed();
        //4. Only 'Create Task' menu item should be enabled:
        await contentWizard.openPublishMenu();
        await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_TASK);
        await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
        await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.UNPUBLISH);
        await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.MARK_AS_READY);
        await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH);
        //5. Duplicate button should be enabled
        await contentWizard.waitForDuplicateButtonEnabled();
        //6. Verify that the content is invalid:
        let result = await contentWizard.isContentInvalid();
        assert.isTrue(result, "The folder should be invalid, because the name input is empty");
    });

    it(`GIVEN folder-wizard is opened WHEN name has been typed THEN 'Save' button gets enabled`, async () => {
        let contentWizard = new ContentWizard();
        //1. Open new folder-wizard
        await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
        //2. Type a name:
        await contentWizard.typeDisplayName(FOLDER_1_NAME);
        //3. Save button gets enabled
        await contentWizard.waitForSaveButtonEnabled();
        await contentWizard.waitForMarkAsReadyButtonVisible();
        //4. Verify that the content gets valid
        let result = await contentWizard.isContentInvalid();
        assert.isFalse(result, "The folder should be valid before the name saving");
        //5. Only Unpublish menu item should be disabled:
        await contentWizard.openPublishMenu();
        await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_TASK);
        await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
        await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.UNPUBLISH);
        await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.MARK_AS_READY);
        await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.PUBLISH);
    });

    it(`GIVEN folder-wizard is opened AND a name has been typed WHEN 'Save' button has been pressed THEN 'Saved' button gets disabled`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open new folder-wizard
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            //2. Type a name:
            await contentWizard.typeDisplayName(FOLDER_1_NAME);
            //3. Click on Save button
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //4. 'Saved' button gets visible
            await contentWizard.waitForSavedButtonVisible();
            //5. The content should be valid
            let result = await contentWizard.isContentInvalid();
            assert.isFalse(result, "The folder should be valid after the saving");
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
