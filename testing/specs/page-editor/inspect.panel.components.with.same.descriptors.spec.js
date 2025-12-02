/**
 * Created on 02.12.2025
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

describe('change.parts.in.inspection.panel.spec - changes parts in Inspection Panel', function () {
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

    // Inspect panel won't refresh after selecting a different component with the same descriptor #9508
    // https://github.com/enonic/app-contentstudio/issues/9508
    it(`GIVEN 2 parts with the same descriptor have been inserted WHEN the second part is selected in Inspect Panel THEN the config of the second part should be displayed in the Inspect Panel`,
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
            await pageComponentView.selectMenuItem(['Insert', 'Part']);
            // 4. Select the part with a config
            await liveFormPanel.selectPartByDisplayName(appConst.PART_NAME.MY_FIRST_APP_CITY_LIST);
            await contentWizard.switchToMainFrame();
            // 5. Open Context Menu for the main region again and insert another part:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Part']);
            // 6. Select the second part component with the same descriptor
            await liveFormPanel.selectPartByDisplayName(appConst.PART_NAME.MY_FIRST_APP_CITY_LIST);
            await contentWizard.switchToMainFrame();
            // 7. Click on the first part in the Page Component View:
            await pageComponentView.clickOnPartComponentByDisplayName(appConst.PART_NAME.MY_FIRST_APP_CITY_LIST, 0);
            await cityListPartInspectionPanel.waitForLoaded();
            // 8. Insert a text in the Zoom Level input:
            await cityListPartInspectionPanel.typeTextInZoomLevelInput(1);
            // 9. Click on the second part in the Page Component View:
            await pageComponentView.clickOnPartComponentByDisplayName(appConst.PART_NAME.MY_FIRST_APP_CITY_LIST, 1);
            // 10. Verify that the config of the second part is displayed in the Inspect Panel:
            let actualText = await cityListPartInspectionPanel.getTextInZoomLevelInput();
            assert.ok(actualText === '', `Expected that the text in the Zoom Level input is empty, but got: ${actualText}`);
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
