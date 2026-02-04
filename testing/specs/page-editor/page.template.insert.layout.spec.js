/**
 * Created on 28.07.2023
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const LayoutInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/layout.inspection.panel');
const TextComponentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel');

describe('page.template.insert.layout.spec: tests for inserting a layout in page templates', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let TEMPLATE;
    const SUPPORT_SITE = 'Site';
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const LAYOUT_NAME = appConst.LAYOUT_NAME.COL_3;
    const TEST_TEXT = 'test text';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP]);
            await studioUtils.doAddSite(SITE);
        });

    it(`Precondition: new template(supports site) should be added`,
        async () => {
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, SUPPORT_SITE, CONTROLLER_NAME);
            await studioUtils.doAddPageTemplate(SITE.displayName, TEMPLATE);
        });

    // verifies - Empty regions are not injected into layout in a Page Template #6592
    it(`GIVEN existing page template has been opened WHEN 3-column layout has been inserted THEN regions should be visible in the layout`,
        async () => {
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let contentWizard = new ContentWizard();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let layoutInspectionPanel = new LayoutInspectionPanel();
            // 1. Open the existing page template:
            await studioUtils.selectAndOpenContentInWizard(TEMPLATE.displayName);
            // 2. Insert 3-column layout:
            await pageComponentsWizardStepForm.openMenu('main');
            await pageComponentsWizardStepForm.selectMenuItem(['Insert', 'Layout']);
            await layoutInspectionPanel.waitForOpened();
            await layoutInspectionPanel.typeNameAndSelectLayout(LAYOUT_NAME);
            // Verify that the site saved automatically(layout was selected):
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('template_layout_saved');
            // 3. Refresh the page in browser
            await contentWizard.refresh();
            await contentWizard.pause(3000);
            await studioUtils.saveScreenshot('template_refreshed_layout');
            // 4. Verify that the layout gets collapsed after refreshing the page:
            await pageComponentsWizardStepForm.expandItem(LAYOUT_NAME);
            // 5. Insert a text component in the left layout's region(Verify that regions are visible):
            await pageComponentsWizardStepForm.openMenu('left');
            await pageComponentsWizardStepForm.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await textComponentInspectionPanel.waitForOpened();
            await textComponentInspectionPanel.clickInTextArea();
            await textComponentInspectionPanel.typeTextInEditor(TEST_TEXT);
            // 6. Save the template
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    // Verify the issue - https://github.com/enonic/app-contentstudio/issues/6596
    // Site is not updated after changes in its template #6596
    it(`GIVEN main region has been reset in the page template WHEN go to the browser tab with the site THEN the layout should not be present in 'Live Editor' in the site as well`,
        async () => {
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open the site with automatic template:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await studioUtils.doSwitchToContentBrowsePanel();
            // 2. Open the page template:
            await studioUtils.selectAndOpenContentInWizard(TEMPLATE.displayName);
            // 3. Expand the menu for 'main' item then click on 'Reset' menu item:
            await pageComponentsWizardStepForm.openMenu('main');
            await pageComponentsWizardStepForm.selectMenuItem(['Reset']);
            // 4. Click on Save in the template wizard:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('template_main_region_reset');
            await contentWizard.waitForNotificationMessage();
            // 5. Switch to the site wizard:
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            await studioUtils.saveScreenshot('main_region_reset_site');
            // 6. Verify that layout-component should be removed in the site as well:
            await contentWizard.switchToLiveEditFrame();
            await liveFormPanel.waitForLayoutComponentNotDisplayed();
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
