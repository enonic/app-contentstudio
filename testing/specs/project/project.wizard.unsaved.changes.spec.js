/**
 * Created on 27.03.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');

describe('project.wizard.unsaved.changes.spec - checks unsaved changes in project wizard', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`GIVEN new project wizard - display name has been typed WHEN 'close' icon has been clicked THEN Confirmation Dialog should appear`,
        async () => {
            let projectDisplayName = studioUtils.generateRandomName("project");
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            //2. Type the display name:
            await projectWizard.typeDisplayName(projectDisplayName);
            //3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(projectDisplayName);
            studioUtils.saveScreenshot("project_wizard_unsaved_changes_1");
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConstant.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it(`GIVEN display name has been typed WHEN 'No' button in Confirmation dialog has been pressed THEN new project should not be created`,
        async () => {
            let projectDisplayName = studioUtils.generateRandomName("project");
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            //2. Type the display name:
            await projectWizard.typeDisplayName(projectDisplayName);
            //3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(projectDisplayName);
            studioUtils.saveScreenshot("project_wizard_unsaved_changes_1");
            await confirmationDialog.waitForDialogOpened();
            //4. Click on No button:
            await confirmationDialog.clickOnNoButton();
            await settingsBrowsePanel.pause(500);
            //5. Verify that new project is not created:
            await settingsBrowsePanel.waitForProjectNotDisplayed(projectDisplayName);
        });

    it(`GIVEN display name has been typed WHEN 'Yes' button in Confirmation dialog has been pressed THEN new project should be created`,
        async () => {
            let projectDisplayName = studioUtils.generateRandomName("project");
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            //2. Type the display name:
            await projectWizard.typeDisplayName(projectDisplayName);
            await projectWizard.clickOnAccessModeRadio("Private");
            //3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(projectDisplayName);
            studioUtils.saveScreenshot("project_wizard_unsaved_changes_1");
            await confirmationDialog.waitForDialogOpened();
            //4. Click on 'Yes' button:
            await confirmationDialog.clickOnYesButton();
            await projectWizard.waitForWizardClosed();
            await settingsBrowsePanel.pause(200);
            //5. Verify that new project is not created:
            await settingsBrowsePanel.waitForItemByDisplayNameDisplayed(projectDisplayName);
        });

    it(`GIVEN new project wizard - description has been typed WHEN 'close' icon has been clicked THEN Confirmation Dialog should appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            //2. Type the description:
            await projectWizard.typeDescription("test");
            //3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon("<Unnamed Project>");
            studioUtils.saveScreenshot("project_wizard_unsaved_description_1");
            //3. Verify tgat the modal dialog is loaded:
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConstant.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it(`GIVEN no changes in new project wizard WHEN 'close' icon has been clicked THEN Confirmation Dialog should not appear`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.'New...' button has been clicked and Project item has been clicked:
            await settingsBrowsePanel.openProjectWizard();
            //2. Click on close-icon
            await settingsBrowsePanel.clickOnCloseIcon("<Unnamed Project>");
            //3. Verify that the wizard is closed:
            await projectWizard.waitForWizardClosed();
            studioUtils.saveScreenshot("project_wizard_no_unsaved_changes");
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
