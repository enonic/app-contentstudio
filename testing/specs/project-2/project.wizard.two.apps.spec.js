/**
 * Created on 07.02.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');

describe('project.wizard.two.apps.spec - Select 2 applications in project wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');

    it(`GIVEN project with two selected apps is opened THEN expected application should be present in the wizard page`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let applications = [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES, appConst.TEST_APPS_NAME.APP_WITH_METADATA_MIXIN];
            // 1. Navigate to Settings Panel:
            await studioUtils.openSettingsPanel();
            // 2. Save new project with two applications:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, 'test description', null, null, 'Private', applications);
            // 3. Select the row and click on 'Edit' button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 4. Go to Applications step form in the wizard page:
            await projectWizard.clickOnWizardStep('Applications');
            await studioUtils.saveScreenshot('proj_wizard_2_selected_apps');
            // 5. Verify the selected applications in the Wizard step form:
            let actualApplications = await projectWizard.getSelectedApplications();
            assert.ok(actualApplications.includes(appConst.TEST_APPS_NAME.APP_CONTENT_TYPES),
                'Expected application should be present in the form');
            assert.ok(actualApplications.includes(appConst.TEST_APPS_NAME.APP_WITH_METADATA_MIXIN),
                'Expected application should be present in the form');
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
