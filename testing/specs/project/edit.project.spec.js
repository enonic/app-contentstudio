/**
 * Created on 26.03.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

describe('edit.project.spec - ui-tests for editing a project', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    const PROJECT2_DISPLAY_NAME = studioUtils.generateRandomName("project");
    const LAYER_NAME = studioUtils.generateRandomName("layer");
    const TEST_DESCRIPTION = "my description";
    const NEW_DESCRIPTION = "new description";

    //Verifies  Project identifier field is editable issue#2923
    it(`GIVEN a display name, description and access mode has been filled in WHEN 'Save' button has been pressed THEN all data should be saved`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1. Open new project wizard:
            await settingsBrowsePanel.openProjectWizard();
            //2. Type a display name and description then click on 'Save' button:
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.typeDescription(TEST_DESCRIPTION);
            await projectWizard.clickOnAccessModeRadio("Private");
            await projectWizard.selectLanguage(appConstant.LANGUAGES.EN);
            await projectWizard.waitForProjectIdentifierInputEnabled();
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForSpinnerNotVisible(appConstant.longTimeout);
            //3. Verify that Identifier Input gets disabled after saving the project
            await projectWizard.waitForProjectIdentifierInputDisabled();
            //4. verify the saved data:
            let actualDescription = await projectWizard.getDescription();
            assert.equal(actualDescription, TEST_DESCRIPTION, "Expected description should be displayed");
            let actualProjectIdentifier = await projectWizard.getProjectIdentifier();
            assert.equal(actualProjectIdentifier, PROJECT_DISPLAY_NAME, "Expected identifier should be displayed");
            let actualLanguage = await projectWizard.getSelectedLanguage();
            assert.equal(actualLanguage, appConstant.LANGUAGES.EN, "Expected language should be displayed");
            //5. Verify that 'Delete' button gets enabled, because new project is created now:
            await projectWizard.waitForDeleteButtonEnabled();
        });

    it(`GIVEN existing project is opened WHEN description has been updated THEN new description should be displayed in browse panel`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Verify that identifier input is disabled:
            await projectWizard.waitForProjectIdentifierInputDisabled();
            //3. Update the description:
            await projectWizard.typeDescription(NEW_DESCRIPTION);
            await projectWizard.waitAndClickOnSave();
            let actualMessage = await projectWizard.waitForNotificationMessage();
            //4. Verify the notification message:
            assert.equal(actualMessage, appConstant.projectModifiedMessage(PROJECT_DISPLAY_NAME));
            //5. Click on 'close-icon' button and close the wizard:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_DISPLAY_NAME);
            await projectWizard.waitForWizardClosed();
            await settingsBrowsePanel.pause(1000);
            //6. Verify that the description is updated in Browse Panel:
            studioUtils.saveScreenshot("project_description_updated");
            let actualDescription = await settingsBrowsePanel.getProjectDescription(PROJECT_DISPLAY_NAME);
            assert.equal(actualDescription, NEW_DESCRIPTION, "Description should be updated in grid");
        });

    it(`GIVEN existing project is opened WHEN 'SU' has been added in 'custom read access' THEN 'SU' should appear in the selected options`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. click on 'Custom' radio:
            await projectWizard.clickOnAccessModeRadio("Custom");
            //3. Select SU in the selector's options:
            await projectWizard.selectUserInCustomReadAccess(appConstant.systemUsersDisplayName.SUPER_USER);
            await projectWizard.waitAndClickOnSave();
            //4. Verify that SU is added in 'Custom Read Access'
            let result = await projectWizard.getSelectedCustomReadAccessOptions();
            assert.equal(result.length, 1, "One option should be selected in Custom Read Access");
            assert.equal(result[0], appConstant.systemUsersDisplayName.SUPER_USER, "SU should be in 'Custom Read Access'");
        });

    it(`WHEN existing project with selected 'Custom Access mode' has been opened THEN 'Custom Access mode' radio should be selected AND expected user should be in this form`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Verify that expected user is displayed in Custom Read Access
            let result = await projectWizard.getSelectedCustomReadAccessOptions();
            assert.equal(result.length, 1, "One option should be selected in Custom Access mode");
            assert.equal(result[0], appConstant.systemUsersDisplayName.SUPER_USER, "'SU' option should be in 'Custom Read Access'");
        });

    it(`GIVEN existing project with selected 'Custom Access mode' WHEN 'Public' radio has been clicked THEN 'Custom Access' combobox gets disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            //1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await projectWizard.clickOnAccessModeRadio("Public");
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            //2. Verify that combobox in 'Custom mode access' gets disabled:
            await projectWizard.waitForCustomAccessModeComboboxDisabled();
            //3. Verify that 'Save' button gets enabled:
            await projectWizard.waitForSaveButtonEnabled();
        });

    //Verifies: Confirmation dialog doesn't appear when switching access mode for a newly created project #2098
    it("GIVEN name and private access mode is saved in new project wizard WHEN 'Public' radio has been clicked THEN confirmation Dialog should be loaded",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            //1. Open new project wizard:
            await settingsBrowsePanel.openProjectWizard();
            //2. Type a display name and select Private access:
            await projectWizard.typeDisplayName(PROJECT2_DISPLAY_NAME);
            await projectWizard.clickOnAccessModeRadio("Private");
            //3. Save the project
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
            //4. Do not close the wizard and update the access mode:
            await projectWizard.clickOnAccessModeRadio("Public");
            //5. Verify that Confirmation Dialog is loaded:
            await confirmationDialog.waitForDialogOpened();
        });

    //Verifies - Access mode should not be changed after canceling changes in Confirmation modal dialog #2295
    it("GIVEN access mode has been changed WHEN 'Cancel top' button has been clicked in the 'Confirmation' dialog THEN access mode returns to the initial state",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            //1.Click on the existing project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT2_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Update the access mode:
            await projectWizard.clickOnAccessModeRadio("Public");
            await confirmationDialog.waitForDialogOpened();
            //3.Click on 'Cancel top' button:
            await confirmationDialog.clickOnCancelTopButton();
            let isSelected = await projectWizard.isAccessModeRadioSelected("Private");
            //4. Verify that access mode returns to the initial state:
            assert.isTrue(isSelected, "Private mode should be reverted in the Access Mode form");
            //5. Verify that 'Save' button is disabled
            await projectWizard.waitForSaveButtonDisabled();
        });

    //Verifies bug - https://github.com/enonic/lib-admin-ui/issues/1475
    // Browse Panel - grid is not refreshed after adding items in the filtered grid
    it("GIVEN existing project is checked and filtered WHEN child layer has been added AND Selection Controller has been unchecked THEN new created layer should be present in grid",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Check the existing project:
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT2_DISPLAY_NAME);
            //2. Click on 'Show Selection' icon(filter the grid):
            await settingsBrowsePanel.clickOnSelectionToggler();
            //3. Open new layer wizard, type a data and save it:
            let layerWizard = await settingsBrowsePanel.openLayerWizard();
            await layerWizard.typeDisplayName(LAYER_NAME);
            await layerWizard.clickOnAccessModeRadio("Public");
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
            //4. Close the wizard:
            await settingsBrowsePanel.clickOnCloseIcon(LAYER_NAME);
            //5. Click on 'Selection Controller' checkbox and clear the filtering:
            await settingsBrowsePanel.clickOnSelectionControllerCheckbox();
            //6. Verify that new layer is present in grid:
            await settingsBrowsePanel.waitForItemDisplayed(LAYER_NAME);
        });

    it("Layer and its parent project are successively deleted",
        async () => {
            //1.Select the layer and delete it:
            await studioUtils.selectAndDeleteProject(LAYER_NAME);
            //2. Select The parent project and delete it:
            await studioUtils.selectAndDeleteProject(PROJECT2_DISPLAY_NAME);
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
