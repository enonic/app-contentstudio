/**
 * Created on 21.04.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');
const SettingsStepForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('create.content.in.project.spec - create new content in the selected context and verify a language in wizards', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    let TEST_DESCRIPTION = "test description";

    it(`Preconditions: new projects(with Norsk (no) language) should be added`,
        async () => {
            //1. Navigate to Settings Panel:
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1. Save new projects:
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME, TEST_DESCRIPTION, appConstant.LANGUAGES.NORSK_NO);
        });

    it(`WHEN existing project has been clicked in 'Select Context' dialog THEN empty grid should be loaded`,
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await projectSelectionDialog.waitForDialogLoaded();
            //1. Select the project in 'Select Context' dialog
            await projectSelectionDialog.selectContext(PROJECT_DISPLAY_NAME);
            //Verify that 'No open issues' - this label should be in Issues Button:
            let actualLabel = await settingsBrowsePanel.getTextInShowIssuesButton();
            assert.equal(actualLabel, appConstant.SHOW_ISSUES_BUTTON_LABEL.NO_OPEN_ISSUES, "'No open issues' should be displayed");
            //Verify that no content items in the browse panel:
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result.length, 0, "Browse Panel should not contain content");
            let actualDisplayName = await contentBrowsePanel.getSelectedProjectDisplayName();
            assert.equal(actualDisplayName, PROJECT_DISPLAY_NAME, "Expected name should be present in the project selected option");
        });

    it(`GIVEN existing context is selected WHEN new folder wizard has been opened THEN expected language should be automatically set in the wizard step`,
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let settingsStepForm = new SettingsStepForm();
            let contentBrowsePanel = new ContentBrowsePanel();
            await projectSelectionDialog.waitForDialogLoaded();
            //1. Select the project in 'Select Context' dialog
            await projectSelectionDialog.selectContext(PROJECT_DISPLAY_NAME);
            //2. Open new folder wizard:
            await studioUtils.openContentWizard(appConstant.contentTypes.FOLDER);
            //3. Verify the language in the wizard:
            let actualLanguage = await settingsStepForm.getSelectedLanguage();
            assert.equal(actualLanguage, appConstant.LANGUAGES.NORSK_NO, "Expected language should be selected in the wizard step form");
        });


    beforeEach(async () => {
        await studioUtils.navigateToContentStudioApp();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
