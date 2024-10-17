/**
 * Created on 24.03.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');

describe('project.delete.in.grid.panel.spec - ui-tests for saving/deleting a project', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');

    it(`Precondition: New project should be added`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await settingsBrowsePanel.openProjectWizardDialog();
            let project = projectUtils.buildProject( null, appConst.PROJECT_ACCESS_MODE.PRIVATE,null,null, PROJECT_DISPLAY_NAME)
            await projectUtils.fillFormsWizardAndClickOnCreateButton(project);
            await settingsBrowsePanel.waitForNotificationMessage();
        });

    it("WHEN 'Sync' button has been pressed THEN expected notification messages appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await settingsBrowsePanel.clickOnSyncButton();
            let messages = await settingsBrowsePanel.waitForNotificationMessages();
            assert.equal(messages[0], appConst.PROJECT_SYNC.STARTED, "Expected message should be displayed");
            // "Content synchronisation job has finished" - this message should appear:
            await settingsBrowsePanel.waitForExpectedNotificationMessage(appConst.PROJECT_SYNC.FINISHED);
        });

    it(`GIVEN existing project is selected WHEN the project has been deleted THEN expected notification should appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmValueDialog = new ConfirmValueDialog();
            // 1. click on the project:
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME);
            // 2. Verify that Delete button gets enabled, then click on it
            await settingsBrowsePanel.clickOnDeleteButton();
            // 3. Verify that Confirmation Dialog is loaded:
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(PROJECT_DISPLAY_NAME);
            // 4. Click on Confirm button:
            await confirmValueDialog.clickOnConfirmButton();
            // 5. Verify the notification message:
            let actualMessage = await settingsBrowsePanel.waitForNotificationMessage();
            await studioUtils.saveScreenshot('project_deleted_1');
            assert.equal(actualMessage, appConst.projectDeletedMessage(PROJECT_DISPLAY_NAME));
            // 6. Verify that the project is not present in Browse Panel:
            await settingsBrowsePanel.waitForProjectNotDisplayed(PROJECT_DISPLAY_NAME);
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
