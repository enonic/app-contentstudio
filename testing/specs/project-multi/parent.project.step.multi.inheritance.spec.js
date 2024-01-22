/**
 * Created on 22.01.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');

describe('parent.project.step.multi.inheritance.spec - ui-tests for parent project wizard step', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    const MULTI_PROJECTS = [PROJECT_DISPLAY_NAME, 'Default'];


    it(`Precondition 1 - parent project should be created`,
        async () => {
            // Save the new project:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, null, null, null, null);
        });

    it("GIVEN Layer Wizard - modal dialog is opened WHEN 'Default' and just created project have been selected in the dropdown THEN 2 selected options should be visible",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            // 1.'New...' button has been clicked:
            await settingsBrowsePanel.clickOnNewButton();
            // 2. 'parent Project Step' dialog should be loaded:
            await parentProjectStep.waitForLoaded();
            // 3. 'Layer' button has been clicked:
            await parentProjectStep.clickOnLayerRadioButton();
            // 4. Two parents have been selected:
            await parentProjectStep.selectParentParentProjects(MULTI_PROJECTS);
            await studioUtils.saveScreenshot('two_parent_project_step');
            // 5. Verify that options filter input gets visible
            await parentProjectStep.waitForProjectOptionsFilterInputDisplayed();
            // 6. Verify - 'Next' button is enabled:
            await parentProjectStep.waitForNextButtonEnabled();
            // 7. Verify two selected options:
            let projects = await parentProjectStep.getSelectedProjects();
            assert.equal(projects[0], PROJECT_DISPLAY_NAME);
            assert.equal(projects[1], 'Default');
            // 8. Click on 'remove' icon:
            await parentProjectStep.clickOnRemoveSelectedProjectIcon('Default');
            await studioUtils.saveScreenshot('single_parent_project_step');
            // 9. Verify that one selected option remains in the step form:
            projects = await parentProjectStep.getSelectedProjects();
            assert.equal(projects[0], PROJECT_DISPLAY_NAME, "Expected project's name should be displayed in the parent step");
            assert.equal(projects.length, 1, 'single selected option should be displayed');
        });

    it('Post conditions: the layer should be deleted',
        async () => {
            // 1.Select and delete the layer:
            await projectUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME)
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
