/**
 * Created on 26.03.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const appConst = require('../../libs/app_const');

describe('edit.project.spec - ui-tests for editing a project', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const PROJECT2_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const TEST_DESCRIPTION = 'my description';
    const PROJ_IDENTIFIER = studioUtils.generateRandomName('id');
    const PROJECT_WIZARD_TOOLBAR_ROLE = 'toolbar';
    const ARIA_LABEL_TOOLBAR = 'Main menu bar';

    // Verifies:  Project identifier field is editable issue#2923
    it(`WHEN existing project is opened THEN expected identifier, description and language should be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1. Open project wizard dialog and create new project:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, TEST_DESCRIPTION, appConst.LANGUAGES.EN, null,
                appConst.PROJECT_ACCESS_MODE.PRIVATE, null, PROJ_IDENTIFIER);
            // 2. Select the project and click on 'Edit' button
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 3. Verify that Identifier Input is disabled
            await projectWizard.waitForProjectIdentifierInputDisabled();
            // 4. verify the saved data:
            let actualDescription = await projectWizard.getDescription();
            assert.equal(actualDescription, TEST_DESCRIPTION, 'Expected description should be displayed');
            let actualProjectIdentifier = await projectWizard.getProjectIdentifier();
            assert.equal(actualProjectIdentifier, PROJ_IDENTIFIER, 'Expected identifier should be displayed');
            let actualLanguage = await projectWizard.getSelectedLanguage();
            assert.equal(actualLanguage, appConst.LANGUAGES.EN, 'Expected language should be displayed');
            await projectWizard.waitForLanguageOptionsFilterInputNotDisplayed();
            // 5. Verify that 'Delete' button should be enabled:
            await projectWizard.waitForDeleteButtonEnabled();
        });

    it(`WHEN existing project is selected THEN expected identifier should be displayed in the settings browse panel`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1.Click on the project select it:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.pause(500);
            // 2. Verify that the expected identifier is displayed in Settings Browse Panel:
            await studioUtils.saveScreenshot('project_identifier');
            let actualIdentifier = await settingsBrowsePanel.getProjectIdentifier(PROJECT_DISPLAY_NAME);
            assert.equal(actualIdentifier, PROJ_IDENTIFIER, "Expected Identifier should be displayed in the grid");
        });

    // Verify Accessibility attributes in Project Wizard Panel:
    it(`WHEN existing project is opened THEN role attribute should be set to 'toolbar' for project-toolbar div`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. Accessibility: Verify that role attribute is set to 'toolbar' for project-toolbar div:
            await projectWizard.waitForToolbarRoleAttribute(PROJECT_WIZARD_TOOLBAR_ROLE);
            // 3. Accessibility: Verify 'Main menu bar' aria-label attribute for the toolbar:
            await projectWizard.waitForToolbarAriaLabelAttribute(ARIA_LABEL_TOOLBAR);
        });


    it(`GIVEN existing project is opened WHEN 'SU' has been added in 'custom read access' THEN 'SU' should appear in the selected options`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. click on 'Custom' radio:
            await projectWizard.clickOnAccessModeRadio('Custom');
            // 3. Select SU in the selector's options:
            await projectWizard.selectUserInCustomReadAccess(appConst.systemUsersDisplayName.SUPER_USER);
            await projectWizard.waitAndClickOnSave();
            // 4. Verify that SU is added in 'Custom Read Access'
            let result = await projectWizard.getSelectedCustomReadAccessOptions();
            assert.equal(result.length, 1, 'One option should be selected in Custom Read Access');
            assert.equal(result[0], appConst.systemUsersDisplayName.SUPER_USER, "SU should be in 'Custom Read Access'");
        });

    it(`WHEN existing project with selected 'Custom Access mode' has been opened THEN 'Custom Access mode' radio should be selected AND expected user should be in this form`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. Verify that expected user is displayed in Custom Read Access
            let result = await projectWizard.getSelectedCustomReadAccessOptions();
            assert.equal(result.length, 1, 'One option should be selected in Custom Access mode');
            assert.equal(result[0], appConst.systemUsersDisplayName.SUPER_USER, "'SU' option should be in 'Custom Read Access'");
        });

    it(`GIVEN existing project with selected 'Custom Access mode' WHEN 'Public' radio has been clicked THEN 'Custom Access' combobox gets disabled`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            // 1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. Click on 'Public' radio:
            await projectWizard.clickOnAccessModeRadio('Public');
            // 3. Confirm, click on 'Yes' button:
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            // 4. Verify that combobox in 'Custom mode access' gets disabled:
            await projectWizard.waitForCustomAccessModeComboboxDisabled();
            // 5. Verify that 'Save' button gets enabled:
            await projectWizard.waitForSaveButtonEnabled();
        });

    it('Precondition: new project should be saved',
        async () => {
            await projectUtils.saveTestProject(PROJECT2_DISPLAY_NAME, null, null, null, appConst.PROJECT_ACCESS_MODE.PRIVATE);
        });

    //Verifies - Access mode should not be changed after canceling changes in Confirmation modal dialog #2295
    it("GIVEN access mode has been changed WHEN 'Cancel top' button has been clicked in the 'Confirmation' dialog THEN access mode returns to the initial state",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            // 1.Click on the existing project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT2_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. Update the access mode:
            await projectWizard.clickOnAccessModeRadio('Public');
            // 3. Verify that confirmation dialog appears:
            await confirmationDialog.waitForDialogOpened();
            // 4.Click on 'Cancel top' button:
            await confirmationDialog.clickOnCancelTopButton();
            let isSelected = await projectWizard.isAccessModeRadioSelected("Private");
            // 5. Verify that access mode returns to the initial state:
            assert.ok(isSelected, "Private mode should be reverted in the Access Mode form");
            // 6. Verify that 'Save' button is disabled
            await projectWizard.waitForSaveButtonDisabled();
        });

    it("Layer and its parent project are successively deleted",
        async () => {
            await projectUtils.selectAndDeleteProject(PROJECT2_DISPLAY_NAME);
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
