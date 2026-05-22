/**
 * Created on 26.03.2020. updated 0n 20.05.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const ProjectWizardDialogAccessModeStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step");
const EditProjectDefaultLanguageStep = require("../../page_objects/project/project-wizard-dialog/edit.project.default.language.step");

const EditProjectNameStep = require("../../page_objects/project/project-wizard-dialog/edit.project.name.step");
const ProjectWizardDialogPermissionsStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step");
const ProjectWizardDialogApplicationsStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.applications.step");
const ProjectWizardDialogSummaryStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.summary.step");

describe('edit.project.spec - ui-tests for editing a project', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('proj');
    const PROJECT2_DISPLAY_NAME = studioUtils.generateRandomName('proj');
    const TEST_DESCRIPTION = 'description';
    const PROJ_IDENTIFIER = studioUtils.generateRandomName('id');
    const IMPORTED_SITE = 'site040269';
    const IMPORTED_PROJECT = 'Default';

    // Verifies:  Project identifier field is editable issue#2923
    it(`WHEN existing project is opened THEN expected identifier, description and language should be displayed`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1. Open project wizard dialog and create new project:
            await projectUtils.saveTestProject({
                name: PROJECT_DISPLAY_NAME,
                description: TEST_DESCRIPTION,
                language: appConst.LANGUAGES.EN,
                accessMode: appConst.PROJECT_ACCESS_MODE.PRIVATE,
                identifier: PROJ_IDENTIFIER
            });
            // 2. Select the project and click on 'Edit' button
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            let editProjectDefaultLanguageStep = new EditProjectDefaultLanguageStep();
            await editProjectDefaultLanguageStep.waitForLoaded();

            let actualLanguage = await editProjectDefaultLanguageStep.getSelectedLanguage();
            assert.equal(actualLanguage, appConst.LANGUAGES.EN, 'Expected language should be displayed');

            let actualParentProject = await editProjectDefaultLanguageStep.getSelectedProject();
            assert.equal(actualParentProject, null, 'Expected parent project should be empty');
            await editProjectDefaultLanguageStep.clickOnNextButton();
            // 3. Verify that Identifier Input is disabled
            let editProjectNameStep = new EditProjectNameStep();
            await editProjectNameStep.waitForLoaded();
            // 4. verify the saved data:
            let actualDescription = await editProjectNameStep.getDescription();
            assert.equal(actualDescription, TEST_DESCRIPTION, 'Expected description should be displayed');
            let actualProjectIdentifier = await editProjectNameStep.getIdentifier();
            assert.equal(actualProjectIdentifier, PROJ_IDENTIFIER, 'Expected identifier should be displayed');

            await editProjectNameStep.clickOnNextButton();
            let projectWizardDialogAccessModeStep = new ProjectWizardDialogAccessModeStep();
            await projectWizardDialogAccessModeStep.waitForLoaded();
            let accessMode = await projectWizardDialogAccessModeStep.getSelectedAccessMode();
            assert.equal(accessMode, appConst.PROJECT_ACCESS_MODE.PRIVATE, 'Expected access mode should be selected');
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

    it(`GIVEN existing project is opened WHEN 'SU' has been added in 'custom read access' THEN 'SU' should appear in the selected options`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1.Click on the project and press 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            let editProjectDefaultLanguageStep = new EditProjectDefaultLanguageStep();
            await editProjectDefaultLanguageStep.waitForLoaded();
            await editProjectDefaultLanguageStep.clickOnNextButton();
            let editProjectNameStep = new EditProjectNameStep();
            await editProjectNameStep.waitForLoaded();
            await editProjectNameStep.clickOnNextButton();

            let projectWizardDialogAccessModeStep = new ProjectWizardDialogAccessModeStep();
            await projectWizardDialogAccessModeStep.waitForLoaded();
            // 2. click on 'Custom' radio:
            await projectWizardDialogAccessModeStep.clickOnAccessModeRadio('Custom');
            // 3. Select SU in the Principal combobox
            await projectWizardDialogAccessModeStep.selectUserInCustomReadAccessSelector(appConst.systemUsersDisplayName.SUPER_USER);

            // 4. Verify that SU is added in 'Custom Read Access'
            let result = await projectWizardDialogAccessModeStep.getSelectedUsersInCustomReadAccessSelector();
            await projectWizardDialogAccessModeStep.clickOnNextButton();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            await permissionsStep.waitForLoaded();
            await permissionsStep.clickOnNextButton();
            let applicationStep = new ProjectWizardDialogApplicationsStep();

            if (await applicationStep.isLoaded()) {
                await applicationStep.clickOnNextButton();
            }

            let projectWizardDialogSummaryStep = new ProjectWizardDialogSummaryStep();
            await projectWizardDialogSummaryStep.waitForLoaded();
            await projectWizardDialogSummaryStep.clickOnUpdateProjectButton();

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
            let editProjectDefaultLanguageStep = new EditProjectDefaultLanguageStep();
            await editProjectDefaultLanguageStep.waitForLoaded();
            await editProjectDefaultLanguageStep.clickOnNextButton();
            let editProjectNameStep = new EditProjectNameStep();
            await editProjectNameStep.waitForLoaded();
            await editProjectNameStep.clickOnNextButton();

            let projectWizardDialogAccessModeStep = new ProjectWizardDialogAccessModeStep();
            await projectWizardDialogAccessModeStep.waitForLoaded();
            // 2. Verify that expected user is displayed in Custom Read Access
            let result = await projectWizardDialogAccessModeStep.getSelectedUsersInCustomReadAccessSelector();
            assert.equal(result.length, 1, 'One option should be selected in Custom Access mode');
            assert.equal(result[0], appConst.systemUsersDisplayName.SUPER_USER, "'SU' option should be in 'Custom Read Access'");
        });


    it('Precondition: the second project should be saved',
        async () => {
            await projectUtils.saveTestProject({
                name: PROJECT2_DISPLAY_NAME,
                description: TEST_DESCRIPTION,
                accessMode: appConst.PROJECT_ACCESS_MODE.PRIVATE,
            });
        });

    // Switching to an empty project doesn't reset Preview/Context panels #8987
    // https://github.com/enonic/app-contentstudio/issues/8987
    // TODO
    it.skip(
        "GIVEN a site has been selected in a project WHEN context has been switch to an empty project THEN Preview panel should be reset",
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            const emptyProject = PROJECT2_DISPLAY_NAME;
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.switchToContentMode();
            // 1. Switch to the imported project and select a site
            await studioUtils.openProjectSelectionDialogAndSelectContext(IMPORTED_PROJECT);
            await contentBrowsePanel.clickOnRowByDisplayName(IMPORTED_SITE);
            // 2. Switch to the empty project:
            await studioUtils.openProjectSelectionDialogAndSelectContext(emptyProject);
            // 3. Verify that browse toolbar is reset
            await contentBrowsePanel.waitForEditButtonDisabled();
            await contentBrowsePanel.waitForDeleteButtonDisabled();
            // 4. Preview panel should be reset as well
            await contentItemPreviewPanel.waitForToolbarNotDisplayed();
        });

    it("Layer and its parent project are successively deleted",
        async () => {
            await projectUtils.selectAndDeleteProject(PROJECT2_DISPLAY_NAME);
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioApp();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
