/**
 * Created on 10.10.2023
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectNotAvailableDialog = require('../../page_objects/project/project.not.available.dialog');
const projectUtils = require('../../libs/project.utils');
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');

describe('publish.wizard.complex.dependencies.spec - tests for config with non required dependencies', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let CHILD_FOLDER;
    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const SHORTCUT_NAME = studioUtils.generateRandomName('shortcut');
    const SHORTCUT_NAME_2 = studioUtils.generateRandomName('shortcut');
    const EXPECTED_NUMBER_ALL = 'All (2)';

    it("Precondition: click on 'Start Wizard' button then create a project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let projectNotAvailableDialog = new ProjectNotAvailableDialog();
            // 1. Project Not Available Dialog should be loaded
            await projectNotAvailableDialog.waitForDialogLoaded();
            // 2. Click on Start button in the modal dialog:
            await projectNotAvailableDialog.clickOnStartWizardButton();
            // 3. Skip the language step
            await languageStep.waitForLoaded();
            await languageStep.clickOnSkipButton();
            // 4. Select 'Private' access mode in the fours step:
            let permissionsStep = await projectUtils.fillAccessModeStep(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await permissionsStep.waitForLoaded();
            // 5. skip the permissions step:
            await permissionsStep.clickOnSkipButton();
            // 6. Skip the applications step
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnSkipButton();
            }
            // 7. Fill in the name input
            let summaryStep = await projectUtils.fillNameAndDescriptionStep(PROJECT_DISPLAY_NAME);
            await summaryStep.waitForLoaded();
            // 8. Click on 'Create Project' button and wait for the dialog is closed:
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
        });

    it("Precondition: site with child folder should be added",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES],
                appConst.CONTROLLER_NAME.MAIN_REGION);
            await studioUtils.doAddSite(SITE);
            let folderName = contentBuilder.generateRandomName('child-folder');
            CHILD_FOLDER = contentBuilder.buildFolder(folderName);
            // Select the site and add a child folder:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await studioUtils.doAddReadyFolder(CHILD_FOLDER);
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/6931
    // Incorrect behaviour of apply selection in Publish Wizard #6931
    it("GIVEN wizard for new shortcut is opened AND site's child folder has been selected in the target selector WHEN checkbox for the parent-item has been selected in Publish Wizard THEN the checkbox remains selected after applying selection",
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open shortcut-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            // 2. Select the folder in the target selector:
            await shortcutForm.filterOptionsAndSelectTarget(CHILD_FOLDER.displayName);
            // 3. Click on 'Mark as ready' button and open  'Publish wizard':
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            // 4. Verify that Hide Excluded Items button is displayed:
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
            // 5. Select the site parent-item in the list:
            await contentPublishDialog.clickOnCheckboxInDependentItem(SITE.displayName);
            // 6. Click on 'Apply selection' button:
            await contentPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('publish_wizard_with_selected_parent_item');
            // 7. The parent-item(site) remains selected:
            let isSelected = await contentPublishDialog.isDependantCheckboxSelected(SITE.displayName);
            assert.isTrue(isSelected, 'The parent-item should be selected in the dependant block');
            // 7. Verify that Hide Excluded Items button is displayed:
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
        });

    it("GIVEN wizard for new shortcut is opened AND site's child folder has been selected in the target selector WHEN checkbox for the child-item has been selected in Publish Wizard THEN 'Hide Excluded' Items button gets hidden",
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open shortcut-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_NAME_2);
            // 2. Select the folder in the target selector:
            await shortcutForm.filterOptionsAndSelectTarget(CHILD_FOLDER.displayName);
            // 3. Click on 'Mark as ready' button and open  'Publish wizard':
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            // 4. Verify that Hide Excluded Items button is displayed:
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
            // 5. Select the site parent-item in the list:
            await contentPublishDialog.clickOnCheckboxInDependentItem(CHILD_FOLDER.displayName);
            // 6. Click on 'Apply selection' button:
            await contentPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('publish_wizard_with_selected_child_item');
            // 7. The parent-item(site) remains selected:
            let isSelected = await contentPublishDialog.isDependantCheckboxSelected(SITE.displayName);
            assert.isTrue(isSelected, 'The parent-item should be selected in the dependant block');
            // 8. The child-item should be selected well:
            isSelected = await contentPublishDialog.isDependantCheckboxSelected(CHILD_FOLDER.displayName);
            assert.isTrue(isSelected, 'The child-item should be selected in the dependant block');
            // 9. Publish Now button should be disabled because of the one item is 'in progress'
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            // 11. Verify the number of itemd in the checkbox:
            let actualNumber = await contentPublishDialog.getNumberInAllCheckbox();
            assert.equal(actualNumber, EXPECTED_NUMBER_ALL, "'All (2)' should be displayed in the checkbox");
            // 12. Verify that Hide/Show Excluded Items buttons are hidden:
            await contentPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
            await contentPublishDialog.waitForShowExcludedItemsButtonNotDisplayed();
        });

    it("Post condition - test project should be deleted",
        async () => {
            // 1. Open Setting panel
            await studioUtils.openSettingsPanel();
            // 2. Select and delete the project:
            await projectUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME);
            let projectNotAvailableDialog = new ProjectNotAvailableDialog();
            await projectUtils.saveScreenshot('the_only_one_project_deleted_2');
            // 3. Verify that Project Not Available modal Dialog is automatically loaded
            await projectNotAvailableDialog.waitForDialogLoaded();
        });

    beforeEach(() => studioUtils.navigateToContentStudioWithProjects());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
