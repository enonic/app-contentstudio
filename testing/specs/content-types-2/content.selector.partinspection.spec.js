/**
 * Created on 29.09.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const CityListPartInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/city.list.part.inspection.panel');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const CityCreationPartInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/city.creation.part.inspection.panel');

describe('my.first.site.country.spec - Create a site with country content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    it(`Precondition: new site with 'main region' controller should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.MY_FIRST_APP, appConst.TEST_APPS_NAME.APP_CONTENT_TYPES],
                'main region');
            await studioUtils.doAddSite(SITE);
        });

    // verify  https://github.com/enonic/app-contentstudio/issues/7315
    // Disable "Apply" button in the Inspections panel when there are no changes to apply #7315
    it(`GIVEN 'City list' part has been inserted WHEN an image has been selected in image-selector in Inspect Panel THEN the option should be saved after clicking on 'Apply' button`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let cityListPartInspectionPanel = new CityListPartInspectionPanel();
            // 1. Open the site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3.Click on the 'Main' region-item and open Context Menu:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, 'Part']);
            // 4. Select the part with a config
            await liveFormPanel.selectPartByDisplayName(appConst.PART_NAME.MY_FIRST_APP_CITY_LIST);
            await contentWizard.switchToMainFrame();
            await cityListPartInspectionPanel.waitForLoaded();
            await cityListPartInspectionPanel.pause(2000);
            // 5. 'Apply' button should be disabled after selecting a part-option in the part-dropdown:
            await cityListPartInspectionPanel.waitForApplyButtonDisabled();
            // 6. Select an image in the dropdown-selector:
            await cityListPartInspectionPanel.selectContentInSelector(appConst.TEST_IMAGES.MAN);
            // 7. Click on 'Apply' button:
            await cityListPartInspectionPanel.clickOnApplyButton();
            // 8. Verify that Notification message appears and 'Save' button gets disabled:
            await studioUtils.saveScreenshot('issue_notification_msg');
            //await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            // 9. Verify that 'Apply' button gets disabled:
            await cityListPartInspectionPanel.waitForApplyButtonDisabled();
            // 10. Verify the selected option:
            let result = await cityListPartInspectionPanel.getSelectedContentDisplayName();
            assert.equal(result, appConst.TEST_IMAGES.MAN, "The expected content should be displayed in the selector");
        });

    // Verifies Console errors when changing selected options in a part config #6857
    // https://github.com/enonic/app-contentstudio/issues/6857
    it(`WHEN the selected option has been changed in the part config THEN new option should be saved after clicking on 'Apply' button`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let cityListPartInspectionPanel = new CityListPartInspectionPanel()
            // 1. Open the site
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on the part-item in the PCV
            await pageComponentsWizardStepForm.clickOnComponent('City list');
            await cityListPartInspectionPanel.waitForLoaded();
            // Verify bug - Disable "Apply" button in the Inspections panel when there are no changes to apply #7315
            // 3. Verify that 'Apply' button is disabled when the Inspect Panel loads:
            await cityListPartInspectionPanel.waitForApplyButtonDisabled();
            // 4. Remove the selected option in the selector in Part config:
            await cityListPartInspectionPanel.removeSelectedContent(appConst.TEST_IMAGES.MAN);
            // 5. Select another content in the dropdown selector:
            await cityListPartInspectionPanel.selectContentInSelector(appConst.TEST_IMAGES.SPUMANS);
            // 6. Verify that 'Apply' button gets enabled:
            await cityListPartInspectionPanel.waitForApplyButtonEnabled();
            // 7. Click on 'Apply' button:
            await cityListPartInspectionPanel.clickOnApplyButton();
            // 8. Verify that Notification message appears and 'Save' button is disabled:
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            // 9. Verify the new selected option:
            let result = await cityListPartInspectionPanel.getSelectedContentDisplayName();
            assert.equal(result, appConst.TEST_IMAGES.SPUMANS, "The expected content should be displayed in the selector");
        });

    // Verifies -  Broken flat list mode in Image Selector #7039
    // https://github.com/enonic/app-contentstudio/issues/7039
    it(`GIVEN existing site is opened WHEN Inspect panel with image selector has been opened THEN expected options should be displayed in flat mode in the expanded combobox`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let cityCreationPartInspectionPanel = new CityCreationPartInspectionPanel();
            // 1. Open the site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3.Click on the 'Main' item and open Context Menu:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, 'Part']);
            // 4. Select the part with image-selector in config
            await liveFormPanel.selectPartByDisplayName(appConst.PART_NAME.MY_FIRST_APP_CITY_CREATION);
            await contentWizard.switchToMainFrame();
            // 5. Verify that Inspect Panel is loaded
            await cityCreationPartInspectionPanel.waitForLoaded();
            // 6. Click on mode-toggle and switch the image-selector to tree mode:
            await cityCreationPartInspectionPanel.clickOnImageSelectorModeTogglerButton();
            // 7. Verify that expected options are displayed in tree mode:
            let items = await cityCreationPartInspectionPanel.getTreeModeOptionsImagesDisplayName();
            assert.ok(items.includes(appConst.TEST_FOLDER_WITH_IMAGES), "Expected item should be present in options");
            assert.ok(items.includes(appConst.TEST_FOLDER_WITH_IMAGES_2), "Expected item should be present in options");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
