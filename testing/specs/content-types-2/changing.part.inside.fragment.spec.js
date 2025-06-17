/**
 * Created on 06.02.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const CityListPartInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/city.list.part.inspection.panel');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');

describe('changing.part.inside.fragment.spec - Tests for changing a part inside fragment', function () {

    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const TEST_TEXT = 'test text';
    const PART_DISPLAY_NAME = 'City list';

    it(`Precondition: new site with 'main region' controller should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES, appConst.MY_FIRST_APP],
                'main region');
            await studioUtils.doAddSite(SITE);
        });

    // Verifies Changing a part inside a fragment causes console errors #7278
    // https://github.com/enonic/app-contentstudio/issues/7278
    it(`GIVEN a text has been inserted in Inspect Panel in the fragment wizard WHEN 'Apply' button has been pressed THEN the text should be saved in the Inspect Panel`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let liveFormPanel = new LiveFormPanel();
            let cityListPartInspectionPanel = new CityListPartInspectionPanel();
            // 1. Open the site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on the 'main' item and open Context Menu:
            await pageComponentsWizardStepForm.openMenu('main');
            await pageComponentsWizardStepForm.selectMenuItem(['Insert', 'Part']);
            // 3. Select the part with a config
            await liveFormPanel.selectPartByDisplayName(PART_DISPLAY_NAME);
            await contentWizard.switchToMainFrame();
            await cityListPartInspectionPanel.waitForLoaded();
            // 4. Open Context Menu for the part:
            await pageComponentsWizardStepForm.openMenu(PART_DISPLAY_NAME);
            // 5. Save the part as fragment:
            await pageComponentsWizardStepForm.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            // 6. Switch to the fragment-wizard:
            await studioUtils.doSwitchToNextTab();
            // 7. Open 'Inspect Panel':
            await pageComponentsWizardStepForm.clickOnComponent(PART_DISPLAY_NAME);
            await cityListPartInspectionPanel.waitForLoaded();
            // 8. Insert a text in the text-input
            await cityListPartInspectionPanel.typeTextInZoomLevelInput(TEST_TEXT);
            // 9. Click on 'Apply' button and save the changes:
            await cityListPartInspectionPanel.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            // 10. Verify that the text is saved in Inspection Panel in fragment-wizard:
            let actualResult = await cityListPartInspectionPanel.getTextInZoomLevelInput();
            assert.equal(actualResult, TEST_TEXT, "Expected text should be saved in the Inspect Panel in fragment wizard");
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
