/**
 * Created on 07.03.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');

describe('insert.part.in.layout.spec - test for parts in a layout', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const CONTROLLER_NAME = 'main region';
    const LAYOUT_3_COL = appConst.LAYOUT_NAME.COL_3;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    // Verifies the bug - Wrong descriptor is loaded when clicking on part/layout #8241
    // https://github.com/enonic/app-contentstudio/issues/8241
    it(`GIVEN two parts have been inserted in '3-col' layout WHEN valid part component has been clicked in LiveView THEN red icon should not be displayed in the PCV `,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();

            let liveFormPanel = new LiveFormPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Insert 3-col layout:
            await pageComponentsWizardStepForm.openMenu('main');
            await pageComponentsWizardStepForm.selectMenuItem(['Insert', 'Layout']);
            await liveFormPanel.selectLayoutByDisplayName(LAYOUT_3_COL);
            await contentWizard.waitForNotificationMessage();
            // 3. Insert the first part(valid):
            await pageComponentsWizardStepForm.openMenu(appConst.LAYOUT_REGION.LEFT);
            await pageComponentsWizardStepForm.selectMenuItem(['Insert', 'Part']);
            await liveFormPanel.selectPartByDisplayName(appConst.PART_NAME.CITY_CREATION);
            // 4. Click on the part in LiveView:
            await liveFormPanel.clickOnPartComponentByName(appConst.PART_NAME.CITY_CREATION);
            await liveFormPanel.pause(1000);
            await liveFormPanel.clickOnPartComponentByName(appConst.PART_NAME.CITY_CREATION);
            await liveFormPanel.pause(1000);
            await studioUtils.saveScreenshot('part_clicked_valid');
            await liveFormPanel.switchToParentFrame();
            // 5. Verify that red icon is not displayed in the PCV:
            let isInvalid = await pageComponentsWizardStepForm.isComponentItemInvalid(appConst.PART_NAME.CITY_CREATION);
            assert.ok(isInvalid === false, 'The part should be valid');
            // 6. Insert the second part(invalid):
            await pageComponentsWizardStepForm.openMenu(appConst.LAYOUT_REGION.CENTER);
            await pageComponentsWizardStepForm.selectMenuItem(['Insert', 'Part']);
            await liveFormPanel.selectPartByDisplayName(appConst.PART_NAME.PART_WITH_ERROR);
            await liveFormPanel.switchToParentFrame();
            await studioUtils.saveScreenshot('part_clicked_invalid');
            // 7. Verify that red icon is displayed beside the part in the PCV:
            isInvalid = await pageComponentsWizardStepForm.isComponentItemInvalid(appConst.PART_NAME.PART_WITH_ERROR);
            assert.ok(isInvalid, 'The part should be displayed as invalid');
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
