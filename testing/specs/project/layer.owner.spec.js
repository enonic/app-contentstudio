/**
 * Created on 14.08.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const SourceCodeDialog = require('../../page_objects/wizardpanel/html.source.code.dialog');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const TextComponentCke = require('../../page_objects/components/text.component');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

describe.skip('layer.owner.spec - ui-tests for user with layer-Owner role ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const SITE_NAME = contentBuilder.generateRandomName('site');
    let SITE;
    let USER;
    const PASSWORD = appConst.PASSWORD.MEDIUM;

    it(`Precondition 1: new system user should be created`,
        async () => {
            // Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName('layer-owner');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it(`Precondition 2 - parent project with private access mode should be created`,
        async () => {
            // 1. Navigate to Settings Panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            // 2. Save new project (mode access is Private):
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME);
        });

    it("Precondition 3: new site should be created by the SU in the parent project",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioApp();
            // 2. Select the new user's context:
            await contentBrowsePanel.selectContext(PROJECT_DISPLAY_NAME);
            // 3. SU adds new site:
            SITE = contentBuilder.buildSite(SITE_NAME, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it("Precondition 4: new layer should be created in the existing project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let parentStep = new ProjectWizardDialogParentProjectStep();
            // 1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioApp();
            await studioUtils.openSettingsPanel();
            // 2. Open Project Wizard Dialog:
            await projectUtils.selectParentAndOpenProjectWizardDialog(PROJECT_DISPLAY_NAME);
            await parentStep.clickOnNextButton();
            // 3. Click on Skip button in language step:
            let languageStep = new ProjectWizardDialogLanguageStep();
            await languageStep.waitForLoaded();
            await languageStep.clickOnSkipButton();
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            // 4. Select 'Private' access mode in the fours step:
            await accessModeStep.clickOnAccessModeRadio("Private");
            await accessModeStep.clickOnNextButton();
            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            await permissionsStep.waitForLoaded();
            // 6. Select the user with default role:
            await permissionsStep.selectProjectAccessRole(USER.displayName);
            // 7. Update the default role to "Owner"
            await permissionsStep.updateUserAccessRole(USER.displayName, appConst.PROJECT_ROLES.OWNER);
            // 8. Click on Next button
            await permissionsStep.clickOnNextButton();
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnSkipButton();
            }
            let summaryStep = await projectUtils.fillNameAndDescriptionStep(LAYER_DISPLAY_NAME);
            await summaryStep.waitForLoaded();
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    // Verifies - https://github.com/enonic/app-contentstudio/issues/2144
    // Localize button should be displayed in browse toolbar after selecting a content in a layer
    it("GIVEN user with 'Owner'-layer role is logged in WHEN 'inherited' site has been selected THEN 'Localize' button should appear in the browse toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            // Verify that Project Selection dialog is loaded, then close it
            await studioUtils.closeProjectSelectionDialog();
            // 2. Select the site:
            await studioUtils.findAndSelectItem(SITE_NAME);
            // 3. Verify that 'Localize' button appears in the browse toolbar:
            await contentBrowsePanel.waitForLocalizeButtonEnabled();
            // 4. Verify that workflow state the same as in the parent project:
            let actualWorkflow = await contentBrowsePanel.getWorkflowStateByName(SITE_NAME);
            assert.equal(actualWorkflow, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);

            // 4. Verify that 'Preview' button is enabled in the preview-item-toolbar
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
            let actualOption = await contentItemPreviewPanel.getSelectedOptionInPreviewWidget();
            assert.equal(actualOption, appConst.PREVIEW_WIDGET.AUTOMATIC,
                'Automatic option should be selected in preview widget by default');
        });

    //Verifies - https://github.com/enonic/app-contentstudio/issues/2309
    //Incorrect default action for inherited content #2309
    it("GIVEN user with 'Owner'-layer role is logged in WHEN 'inherited' site has been selected THEN 'Mark as ready' button should appear in the browse toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            // user's context should be loaded by default now!
            // 2. Select the site:
            await studioUtils.findAndSelectItem(SITE_NAME);
            // 3. Verify that 'Mark as Ready' is default action in Publish Menu
            await contentBrowsePanel.waitForDefaultAction(appConst.PUBLISH_MENU.MARK_AS_READY);
        });

    it("GIVEN user with 'Owner'-layer role is logged in WHEN the user attempts to open existing site in draft THEN expected page should be loaded",
        async () => {
            // 1. Do Log in with the user:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            //user's context should be loaded by default now!
            // 2. load existing site from the current layer:
            let url = "http://localhost:8080/admin/site/preview" + `/${LAYER_DISPLAY_NAME}/draft/${SITE_NAME}`;
            await studioUtils.getBrowser().url(url);
            // 3. Verify that expected site is loaded:
            let actualTitle = await studioUtils.getBrowser().getTitle();
            assert.equal(actualTitle, SITE_NAME, 'expected site should be loaded');
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("Precondition: Existing site has been marked as ready in the parent project",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioWithProjects();
            // 2. the  user's context should be loaded by default, so need to switch to Default project
            await contentBrowsePanel.selectContext(PROJECT_DISPLAY_NAME);
            await studioUtils.findAndSelectItem(SITE_NAME);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN 'inherited' site was marked as ready in the parent project THEN workflow in child layer should be 'Ready for publishing'",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog(USER.displayName, PASSWORD);
            // 2. Select the site:
            await studioUtils.findAndSelectItem(SITE_NAME);
            // 3. Verify that 'Localize' button appears in the browse toolbar:
            await contentBrowsePanel.waitForLocalizeButtonEnabled();
            // 4. Verify that workflow state the same as in the parent project:
            let actualWorkflow = await contentBrowsePanel.getWorkflowStateByName(SITE_NAME);
            assert.equal(actualWorkflow, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
        });

    // Users with Owner and Editor roles don't have access to HTML source in the editor #8526
    // https://github.com/enonic/app-contentstudio/issues/8526
    it("GIVEN user with 'Owner'-layer role is logged in WHEN wizard page with htmlArea has been opened THEN 'Source' button should be displayed in the htmlArea toolbar",
        async () => {
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog(USER.displayName, PASSWORD);
            let htmlAreaForm = new HtmlAreaForm();
            let sourceCodeDialog = new SourceCodeDialog();
            // 1. Open wizard for new content with htmlArea:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.showToolbar();
            await studioUtils.saveScreenshot('owner_source_button');
            // 2. Verify that 'Source' button is displayed for Owner (in the htmlArea toolbar)
            await htmlAreaForm.clickOnSourceButton();
            await sourceCodeDialog.waitForDialogLoaded();
        });

    // Verifies  https://github.com/enonic/app-contentstudio/issues/6711
    // PCV remains disabled after clicking on Localize button in Wizard #6711
    it("GIVEN user with 'Owner' role do double click on the inherited site WHEN 'Localize' button has been clicked THEN PCV gets unlocked in the wizard step",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let contentWizard = new ContentWizard();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog(USER.displayName, PASSWORD);
            // 2. Make a double click on the site:
            await contentBrowsePanel.doubleClickOnRowByDisplayName(SITE.displayName);
            await studioUtils.doSwitchToNewWizard();
            await contentWizard.waitForOpened();
            // 3. Verify that PCV is disabled:
            await pageComponentsWizardStepForm.waitForLoaded();
            await pageComponentsWizardStepForm.waitForLocked();
            // 4. Click on Localize button in the wizard-toolbar:
            await contentWizard.clickOnLocalizeButton();
            await studioUtils.saveScreenshot('localized_site_pcv');
            // 5. Verify the message:
            let message = await contentWizard.waitForNotificationMessage();
            await pageComponentsWizardStepForm.waitForNotLocked();
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.INHERITED_CONTENT_LOCALIZED, 'Expected notification message should be displayed');
            // 6. Verify that Preview button is enabled in the ItemPreview toolbar:
            await contentWizard.waitForPreviewButtonEnabled();
            let actualOption = await contentWizard.getSelectedOptionInPreviewWidget();
            assert.equal(actualOption, appConst.PREVIEW_WIDGET.AUTOMATIC,
                'Automatic option should be selected in preview widget by default');
        });

    // Verifies -  Incorrect state for Preview button in inherited site #8613
    it("GIVEN localized site has been opened WHEN 'Reset' button has been clicked THEN Preview button should enabled in the ItemPreview toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog(USER.displayName, PASSWORD);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnEditButton();
            await studioUtils.doSwitchToNewWizard();
            await contentWizard.waitForOpened();
            // 2. Verify that 'Preview' button is enabled in the ItemPreview toolbar:
            await contentWizard.waitForPreviewButtonEnabled();
            // 3. Reset button has been clicked
            await contentWizard.clickOnResetButton();
            let confirmationDialog = new ConfirmationDialog();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            // 6. Verify that 'Preview' button is enabled in the ItemPreview toolbar:
            await contentWizard.waitForPreviewButtonEnabled();
            // 7. Click on Localize button in the wizard-toolbar:
            await contentWizard.clickOnLocalizeButton();
            // 8. Verify that 'Preview' button is enabled in the ItemPreview toolbar:
            await contentWizard.waitForPreviewButtonEnabled();
        });

    it("GIVEN user with 'Owner'-layer role is logged in WHEN new text component has been inserted THEN 'Source' button should be displayed in the htmlArea toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog(USER.displayName, PASSWORD);
            let htmlAreaForm = new HtmlAreaForm();
            let sourceCodeDialog = new SourceCodeDialog();
            // 2. Click on Localise , Open the site:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnEditButton();
            await studioUtils.doSwitchToNextTab();
            await contentWizard.waitForOpened();
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert a text component
            await pageComponentView.openMenu('main');
            // 4. Insert new text component:
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.switchToLiveEditFrame();
            // 5. Verify that Source button is clickable on the toolbar:
            await textComponentCke.clickOnSourceButton();
            await textComponentCke.switchToParentFrame();
            await sourceCodeDialog.waitForDialogLoaded();
            await sourceCodeDialog.clickOnCancelButton();
        });

    afterEach(async () => {
        let title = await studioUtils.getBrowser().getTitle();
        // Do not close the Login page:
        if (title.includes(appConst.CONTENT_STUDIO_TITLE) || title.includes('Users') || title.includes(appConst.TAB_TITLE_PART)) {
            return await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        }
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
