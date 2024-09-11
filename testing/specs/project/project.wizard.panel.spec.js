/**
 * Created on 15.03.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils.js');

describe('project.wizard.panel.spec - ui-tests for project wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = appConst.generateRandomName('Project1');

    it(`GIVEN new project wizard has been created WHEN Edit button has been clicked THEN required elements should be present in the wizard page`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1.'New...' button has been clicked and new project has been created:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME);
            // 2. open just created project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await projectWizard.waitForDescriptionInputDisplayed();
            // 3. Verify that Identifier input is disabled:
            await projectWizard.waitForProjectIdentifierInputDisabled()
            await projectWizard.waitForRolesComboboxDisplayed();
            let result = await projectWizard.isLocaleOptionsFilterInputClickable();
            assert.ok(result, 'Locale input should  be clickable');
            // 4. Verify access mode: all radio button should not be selected:
            let isSelected = await projectWizard.isAccessModeRadioSelected('Custom');
            assert.ok(isSelected === false, "'Custom' radio button should not be selected");
            // 5. Verify that Private radio is selected:
            isSelected = await projectWizard.isAccessModeRadioSelected('Private');
            assert.ok(isSelected, "'Private' radio button should be selected");
            // 6. Public radio button should not be selected:
            isSelected = await projectWizard.isAccessModeRadioSelected('Public');
            assert.ok(isSelected === false, "'Public' radio button should not be selected");
            // 7. Applications dropdown should be displayed:
            await projectWizard.waitForProjectApplicationsOptionsFilterInputDisplayed();
            await projectWizard.waitForDeleteButtonEnabled();
        });

    it("Deleting a project whose name contains uppercase letters",
        async () => {
            await projectUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME,PROJECT_DISPLAY_NAME.toLowerCase());
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
