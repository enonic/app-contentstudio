/**
 * Created on 29.07.2019.  updated on 13.07.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentUnpublishDialog = require('../../page_objects/content.unpublish.dialog');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const RenameContentDialog = require("../../page_objects/wizardpanel/rename.content.dialog");
const WizardDetailsWidgetScheduleSection = require("../../page_objects/wizardpanel/details/wizard.widget.schedule.section");

describe('wizard.publish.menu.workflow.spec - publishes and unpublishes single folder in wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;
    const NEW_DISPLAY_NAME = appConst.generateRandomName('new');

    it(`GIVEN name input is filled in WHEN display name input is empty THEN only 'Create Task' menu item should be enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            let renameContentDialog = new RenameContentDialog();
            // 1. Open wizard for new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 2. Fill in the name(path) input
            await contentWizard.clickOnRenameContentDialogButton('<Name>');
            await renameContentDialog.waitForDialogLoaded();
            await renameContentDialog.typeInNewNameInput(appConst.generateRandomName('folder'));
            await renameContentDialog.clickOnRenameButton();
            await renameContentDialog.waitForDialogClosed();
            // 3. The content should be automatically saved:
            await contentWizard.waitForNotificationMessage();
            // 4. Click on dropdown handle and verify the menu items:
            await contentWizard.waitForPublishMenuDropdownHandleDisabled();
            await contentWizard.waitForCreateIssueButtonDisplayed();
            await studioUtils.saveScreenshot('publish_menu_items2');
            // Only 'Create Issue' menu item should be available
            // 5. The content should be invalid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, "The content should be invalid");
        });

    it(`GIVEN 'Marked as Ready' folder is opened WHEN 'Publish...' button has been pressed AND the folder has been published THEN 'UNPUBLISH' button gets visible in the toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 1. Publish the folder:
            await contentWizard.doPublish();
            await contentWizard.pause(1000);
            // 2. 'Page Editor' is opened by default, Verify that status gets  Published
            await studioUtils.saveScreenshot('check_default_action_unpublish');
            let status = await contentWizard.getContentStatusInToolbar();
            assert.equal(status, appConst.CONTENT_STATUS.ONLINE);
            // 2. Verify that Unpublish is default action now
            await contentWizard.waitForUnpublishButtonDisplayed();
        });

    it(`GIVEN existing 'published' folder is opened WHEN publish menu has been expanded THEN 'Request Publishing...' menu item should be disabled AND 'Create Task...' is enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open the 'published' folder
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 2. Click on dropdown handle and open Publish Menu:
            await contentWizard.openPublishMenu();
            await studioUtils.saveScreenshot('publish_menu_items2');
            // 3. Verify that just only 1 menu items is enabled
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH);
            await contentWizard.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.MARK_AS_READY);

            await contentWizard.clearDisplayNameInput();
            await contentWizard.typeDisplayName(NEW_DISPLAY_NAME);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN existing 'Modified' folder is opened WHEN publish menu has been expanded THEN 'Request Publishing' menu item should be enabled AND 'Create Issue' is enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectByDisplayNameAndOpenContent(NEW_DISPLAY_NAME);
            // Click on dropdown handle and open Publish Menu:
            await contentWizard.openPublishMenu();
            await studioUtils.saveScreenshot('publish_menu_items3');
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.UNPUBLISH);
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.PUBLISH);
        });

    it(`GIVEN existing 'modified' content is opened WHEN 'unpublish' button has been pressed AND it confirmed in the modal dialog THEN 'UNPUBLISHED' status should appear in the wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            let wizardDetailsWidgetScheduleSection = new WizardDetailsWidgetScheduleSection();
            // 1. Open the modified content:
            await studioUtils.selectByDisplayNameAndOpenContent(NEW_DISPLAY_NAME);
            // 2. Verify that Schedule widget item should be present in the Details widget:
            await wizardDetailsWidgetScheduleSection.waitForLoaded();
            let result =  await wizardDetailsWidgetScheduleSection.getOnlineFromValue();
            assert.ok(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(result),
                `'Online from' should match 'YYYY-MM-DD HH:mm:ss' format, but was: ${result}`);
            //'MARK AS READY' is default action now
            // So need to open the publish-menu and select 'Unpublish...' menu item
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.UNPUBLISH);
            // 3. open 'Unpublish Content' Dialog:
            let contentUnpublishDialog = new ContentUnpublishDialog();
            await contentUnpublishDialog.waitForDialogOpened();
            // 4. Click on Unpublish button in the dialog:
            await contentUnpublishDialog.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogClosed();
            // 5. Status should be Unpublished and 'Mark as Ready' button should be visible
            await contentWizard.waitForContentStatusInToolbar(appConst.CONTENT_STATUS.OFFLINE);
            // TODO bug  https://github.com/enonic/app-contentstudio/issues/11045
            //await contentWizard.waitForMarkAsReadyButtonVisible();
            // 6. Verify the workflow state:
            let workflow = await contentWizard.getContentWorkflowState();
            //  TODO bug  https://github.com/enonic/app-contentstudio/issues/11045
            //assert.equal(workflow, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            // 7. Schedule widget item gets not visible in the Details widget:
            await wizardContextPanel.waitForScheduleWidgetItemNotDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
