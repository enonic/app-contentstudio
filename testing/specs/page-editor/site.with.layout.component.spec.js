/**
 * Created on 30.07.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const appConst = require('../../libs/app_const');

describe('site.with.layout.component.spec - specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const LAYOUT_NAME = '3-col';

    it(`GIVEN existing site is opened  WHEN 3-column layout has been inserted THEN layout-component with 3 regions should be present in Live Edit`,
        async () => {

            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);

            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert the Layout component (3-column):
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            await liveFormPanel.selectLayoutByDisplayName(LAYOUT_NAME);
            // Verify that the site saved automatically(layout was selected):
            await contentWizard.waitForNotificationMessage();
            let columns = await liveFormPanel.getLayoutColumnNumber();
            assert.equal(columns, 3, 'Three columns should be in the layout component');
        });

    it("GIVEN the site is opened WHEN text component has been inserted in the left region THEN expected text should be present in the layout component",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Expand the layout item:
            await pageComponentView.expandItem(LAYOUT_NAME);
            // 4. Insert the first text component:
            await pageComponentView.openMenu('left');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor('text left');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.switchToLiveEditFrame();
            let result = await liveFormPanel.getTextInEditableLayoutComponent()
            assert.equal(result[0], 'text left', 'Expected text should be present in the layout component');
        });

    it("GIVEN the site is opened WHEN text component has been inserted in the center region THEN expected text should be present in the layout component",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open existing site with 3-col layout:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Expand the layout item:
            await pageComponentView.expandItem(LAYOUT_NAME);
            // 4. Insert the first text component:
            await pageComponentView.openMenu('center');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor('text center');
            // 5. Save the site:
            await contentWizard.waitAndClickOnSave();
            // 5. Verify that expected text is displayed in Live Edit panel: both text components should be in Edit mode
            await contentWizard.switchToLiveEditFrame();
            let result = await liveFormPanel.getTextInEditableLayoutComponent();
            assert.ok(result.length === 2, 'Two text components should be in Edit mode now');
            assert.equal(result[1], 'text center', 'Expected text should be present in the layout component');
        });

    it("GIVEN the site is opened WHEN text component has been inserted in the right region THEN expected text should be present in the layout component",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open existing site with 3-col layout:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Expand the layout item:
            await pageComponentView.expandItem(LAYOUT_NAME);
            // 4. Insert the first text component:
            await pageComponentView.openMenu('right');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.typeTextInCkeEditor('text right');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.switchToLiveEditFrame();
            let result = await liveFormPanel.getTextInEditableLayoutComponent();
            assert.equal(result[2], 'text right', 'Expected text should be present in the layout component');
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
