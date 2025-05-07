/**
 * Created on 20.07.2021.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const EmulatorWidget = require('../../page_objects/wizardpanel/details/emulator.widget');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const appConst = require('../../libs/app_const');

describe('widget.selector.spec: tests for options in the widget selector', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = 'main region';

    it(`GIVEN wizard for new site is opened WHEN page controller has been selected THEN 'Page' option item should be displayed in WidgetSelector dropdown`,
        async () => {
            let contentWizard = new ContentWizard();
            let siteFormPanel = new SiteFormPanel();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let displayName = appConst.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            // 1. Open wizard for new site:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(displayName);
            // 2. Select an application
            await siteFormPanel.filterOptionsAndSelectApplication(appConst.APP_CONTENT_TYPES);
            await contentWizard.waitForNotificationMessage();
            // 3. Click on Widget Selector dropdown handler:
            await wizardDetailsPanel.clickOnWidgetSelectorDropdownHandle();
            // 4. Verify that 'Page' option is displayed before the selecting a controller:
            let actualOptions1 = await wizardDetailsPanel.getWidgetSelectorDropdownOptions();
            assert.ok(actualOptions1.includes(appConst.WIDGET_SELECTOR_OPTIONS.PAGE) === true,
                "'Page' option should be displayed in the dropdown list");
            // 5. Select a controller:
            await contentWizard.selectPageDescriptor(CONTROLLER_NAME);
            // 6. Verify that 'Components' option appears in options after selecting a controller:
            await wizardDetailsPanel.clickOnWidgetSelectorDropdownHandle();
            await studioUtils.saveScreenshot('controller_selected_widget_menu_1');
            let actualOptions2 = await wizardDetailsPanel.getWidgetSelectorDropdownOptions();
            assert.ok(actualOptions2.includes(appConst.WIDGET_SELECTOR_OPTIONS.PAGE),
                "'Page' option should be displayed in the dropdown list");
        });


    // Verify Two items are selected in Widget selector #7897
    // https://github.com/enonic/app-contentstudio/issues/7897
    it(`GIVEN existing site is opened WHEN WidgetSelector dropdown has been expanded THEN the only one item is selected in the options list (Page)`,
        async () => {
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on Widget selector dropdown handle and expand the ListBox:
            await wizardDetailsPanel.clickOnWidgetSelectorDropdownHandle();
            // 3. Verify that the only one item is selected in the options list
            let items = await wizardDetailsPanel.getSelectedOptionsDisplayName();
            assert.equal(items.length, 1, 'The only one item should be selected in the ListBox');
            assert.equal(items[0], appConst.WIDGET_SELECTOR_OPTIONS.PAGE, "'Page' option item should be selected in the ListBox");
        });

    // Verify Two items are selected in Widget selector #7897
    // https://github.com/enonic/app-contentstudio/issues/7897
    it(`GIVEN Select 'Version History' option in the widget selector WHEN ListBox has been expanded THEN 'Version History' option item should be selected in the ListBox options`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let emulatorWidget = new EmulatorWidget();
            // 1. Open the existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Select Emulator option in the widget selector
            await wizardDetailsPanel.openVersionHistory();
            await wizardDetailsPanel.clickOnWidgetSelectorDropdownHandle();
            // 3. Verify that the only one item is selected in the options list
            let items = await wizardDetailsPanel.getSelectedOptionsDisplayName();
            assert.equal(items.length, 1, 'The only one item should be selected in the ListBox');
            assert.equal(items[0], 'Version history', "'Version history' option item should be selected in the ListBox");
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
