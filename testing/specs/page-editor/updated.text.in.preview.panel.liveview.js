/**
 * Created on 16.12.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const TextComponentCke = require('../../page_objects/components/text.component');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');


describe('updated.text.in.preview.panel.liveview.spec - verify that text is updated in preview panel in Live view', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const TEST_TEXT_1 = 'hello';
    const TEST_TEXT_2 = 'world'


    it("Precondition: new site should be added",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            // the site should be with 'main region' controller:
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES],
                appConst.CONTROLLER_NAME.MAIN_REGION);
            await studioUtils.doAddSite(SITE);
        });

    // https://github.com/enonic/app-contentstudio/issues/8082
    // Live View Panel is not updated after updating its content in wizard #8082
    it("GIVEN existing site with text component is opened WHEN the text has been updated in the wizard THEN the text shouls be updated in LiveView in Preview panel as well",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert a text-component in PCV modal dialog:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            // 4. Insert a text in the text-component:
            await textComponentCke.typeTextInCkeEditor(TEST_TEXT_1);
            await contentWizard.switchToMainFrame();
            // 5. Save the content:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 6. Switch to Content Browse panel:
            await studioUtils.doSwitchToContentBrowsePanel();
            // 7. Verify the inserted text in LiveView in Preview panel:
            await contentItemPreviewPanel.switchToLiveViewFrame();
            let actualText = await contentItemPreviewPanel.getTextFromTextComponent();
            assert.equal(actualText, TEST_TEXT_1, "The inserted text should be displayed in the preview panel");
            // 8. Switch to the site again:
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            // 9. Update the text in text-component:
            await pageComponentView.openMenu(TEST_TEXT_1);
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.EDIT]);
            await textComponentCke.typeTextInCkeEditor(TEST_TEXT_2);
            // 10. Save the site:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 11. Switch to Content Browse panel:
            await studioUtils.doSwitchToContentBrowsePanel();
            // 12. Verify the updated text in LiveView in Preview panel:
            await contentItemPreviewPanel.switchToLiveViewFrame();
            actualText = await contentItemPreviewPanel.getTextFromTextComponent();
            assert.equal(actualText, TEST_TEXT_2, "The updated text should be displayed in the preview panel");
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
