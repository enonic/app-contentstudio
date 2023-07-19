/**
 * Created on 16.07.2023
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const TextComponentCke = require('../../page_objects/components/text.component');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectNotAvailableDialog = require('../../page_objects/project/project.not.available.dialog');
const projectUtils = require('../../libs/project.utils');

describe('publish.wizard.non.required.dependencies.spec - tests for config with excludeDependencies=true', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let TEST_FOLDER;
    const CONTENT_LINK_TITLE = appConst.generateRandomName('link');
    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');

    it("Precondition: click on 'Start Wizard' button then create a project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let projectNotAvailableDialog = new ProjectNotAvailableDialog();
            await projectUtils.saveScreenshot('step_1_create_project');
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

    it("Precondition: ready for publishing site should be added",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES],
                appConst.CONTROLLER_NAME.MAIN_REGION);
            await studioUtils.doAddSite(SITE);
            let folderName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(folderName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
        });

    it("GIVEN existing site with is opened WHEN content link has been inserted THEN new dependency item should appear for the site",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Select the 'main region' page controller:
            //await contentWizard.selectPageDescriptor(appConst.CONTROLLER_NAME.MAIN_REGION)
            // 3. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 4. Insert a text-component in PCV modal dialog:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            // 5. Close the details panel
            await contentWizard.clickOnDetailsPanelToggleButton();
            await textComponentCke.switchToLiveEditFrame();
            // 6. Open Insert Link dialog
            await textComponentCke.clickOnInsertLinkButton();
            // 7. Insert the content-link(link to a folder in the root directory):
            await studioUtils.insertContentLinkInCke(CONTENT_LINK_TITLE, TEST_FOLDER.displayName, true);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN site with non-required dependency item is selected WHEN 'Publish wizard' is opened WHEN 'Show excluded' button should be displayed in the modal dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the existing site with a dependency click on 'Mark as Ready' button::
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            // 2. Publish wizard should be automatically loaded:
            await contentPublishDialog.waitForDialogOpened();
            // 3. Verify that 'show excluded' button is displayed:
            await contentPublishDialog.waitForShowExcludedItemsButtonDisplayed();
            // 4. Click on 'show excluded' button:
            await contentPublishDialog.clickOnShowExcludedButtonItems();
            // 5. Verify that 'show excluded' button is not displayed now:
            await contentPublishDialog.waitForShowExcludedItemsButtonNotDisplayed();
            // 6. Verify that the only one dependency item is shown in the list:
            let depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 1, 'The only one dependent item should be in the dependencies list');
            // 7. Verify that the checkbox for the dependency item is not selected:
            let isCheckboxSelected = await contentPublishDialog.isDependantCheckboxSelected(TEST_FOLDER.displayName);
            assert.isFalse(isCheckboxSelected, 'Checkbox for the dependent item should not be selected');
        });

    it("GIVEN 'Show excluded' button has been clicked in the 'Publish Wizard' WHEN 'Hide excluded' has been pressed THEN non-required dependency item gets not visible in the modal dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the existing site with a dependency click on 'Mark as Ready' button::
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            //await contentBrowsePanel.waitForNotificationMessage();
            // 2. Publish wizard should be automatically loaded:
            await contentPublishDialog.waitForDialogOpened();
            // 3. Click on 'show excluded' button:
            // TODO rename the method:
            await contentPublishDialog.clickOnShowExcludedButtonItems();
            // 5. Verify that 'show excluded' button is not displayed now:
            await contentPublishDialog.clickOnHideExcludedItemsButton();
            // 6. Verify that the dependency items are not shown in the list:
            let depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 0, 'dependencies list should be empty');
            // 7. Click on 'Include child items' toggler:
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            // 8. Verify that expected dependency item gets visible in the dialog:
            await contentPublishDialog.waitForDependenciesListDisplayed();
            depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 1, 'non-required dependency should not be displayed in the list');
            assert.isTrue(depItems[0].includes('_templates'), 'non-required dependency should not be displayed in the list');
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