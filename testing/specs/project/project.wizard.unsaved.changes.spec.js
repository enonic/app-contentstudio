/**
 * Created on 27.03.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');

describe('project.wizard.unsaved.changes.spec - checks unsaved changes in project wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_NAME = studioUtils.generateRandomName('project');
    const PROJECT_NAME_2 = studioUtils.generateRandomName('project');

    it(`GIVEN existing project is opened WHEN name has been updated AND 'close' icon has been clicked THEN Confirmation Dialog should appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            //1.'New...' button has been clicked and new Project has been created:
            await projectUtils.saveTestProject(PROJECT_NAME);
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Type the display name:
            await projectWizard.typeDisplayName(PROJECT_NAME_2);
            //3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_NAME_2);
            await studioUtils.saveScreenshot("project_wizard_unsaved_changes_1");
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConst.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it(`GIVEN display name has been updated WHEN 'No' button in Confirmation dialog has been pressed THEN new project should not be created`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            //1.open existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Type the display name:
            await projectWizard.typeDisplayName(PROJECT_NAME_2);
            //3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_NAME_2);
            await studioUtils.saveScreenshot("project_wizard_unsaved_changes_1");
            await confirmationDialog.waitForDialogOpened();
            //4. Click on No button:
            await confirmationDialog.clickOnNoButton();
            await projectWizard.waitForWizardClosed();
            await settingsBrowsePanel.pause(500);
            //5. Verify that new project is not created:
            await settingsBrowsePanel.waitForProjectNotDisplayed(PROJECT_NAME_2);
        });

    it(`GIVEN display name has been typed WHEN 'Yes' button in Confirmation dialog has been pressed THEN project with new name should be present in grid`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            // 1.open existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. Type the display name:
            await projectWizard.typeDisplayName(PROJECT_NAME_2);
            // 3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_NAME_2);
            await studioUtils.saveScreenshot('project_wizard_unsaved_changes_1');
            await confirmationDialog.waitForDialogOpened();
            // 4. Click on 'Yes' button:
            await confirmationDialog.clickOnConfirmButton();
            await projectWizard.waitForWizardClosed();
            await settingsBrowsePanel.pause(200);
            // 5. Verify that new project is not created:
            await settingsBrowsePanel.waitForItemByDisplayNameDisplayed(PROJECT_NAME_2);
        });

    it(`GIVEN no changes in new project wizard WHEN 'close' icon has been clicked THEN Confirmation Dialog should not appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1. Open existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_NAME_2);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. Click on close-icon
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_NAME_2);
            // 3. Verify that the wizard is closed:
            await projectWizard.waitForWizardClosed();
            await studioUtils.saveScreenshot("project_wizard_no_unsaved_changes");
        });

    it("Post condition: the project should be deleted",
        async () => {
            //1.Select the layer and delete it:
            await projectUtils.selectAndDeleteProject(PROJECT_NAME_2,PROJECT_NAME);
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
