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
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const TextComponentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel');

describe('updated.text.in.preview.panel.liveview.spec - verify that text is updated in preview panel in Live view', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const TEST_TEXT_1 = 'hello';
    const TEST_TEXT_2 = 'world'


    it('Precondition: new site should be added',
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            // the site should be with 'main region' controller:
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES],
                appConst.CONTROLLER_NAME.MAIN_REGION);
            await studioUtils.doAddSite(SITE);
        });

    // https://github.com/enonic/app-contentstudio/issues/8082
    // Live View Panel is not updated after updating its content in wizard #8082
    // https://github.com/enonic/app-contentstudio/issues/8324
    it("GIVEN existing site with text component is opened WHEN the text has been updated in the wizard THEN the text should be updated in LiveView in Preview panel as well",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
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
            await contentItemPreviewPanel.switchToTextFrame();
            let actualText = await contentItemPreviewPanel.getTextFromTextComponent(0);
            assert.equal(actualText, TEST_TEXT_1, "The inserted text should be displayed in the preview panel");
            // 8. Switch to the site again:
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            // 9. Update the text in text-component:
            await pageComponentView.openMenu(TEST_TEXT_1);
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.EDIT]);
            await textComponentCke.typeTextInCkeEditor(TEST_TEXT_2);
            // 10. Save the site:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('issue_notification_msg_2');
            // await contentWizard.waitForNotificationMessage();
            // 11. Switch to Content Browse panel:
            await studioUtils.doSwitchToContentBrowsePanel();
            // 12. Verify the updated text in LiveView in Preview panel:
            await contentItemPreviewPanel.switchToTextFrame();
            actualText = await contentItemPreviewPanel.getTextFromTextComponent(0);
            assert.equal(actualText, TEST_TEXT_2, "The updated text should be displayed in the preview panel");
        });

    // Verify the issue - https://github.com/enonic/app-contentstudio/issues/8295
    // Preview button gets disabled after reselecting a site #8295
    it("GIVEN existing site(with a selected controller) is highlighted WHEN the site reselected in the second time THEN Preview button should be enabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let textComponentCke = new TextComponentCke();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Click on the existing site(highlight it ):
            await studioUtils.findAndSelectItem(SITE.displayName);
            // 2. Verify that Preview button is enabled:
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
            // 3. Click on the site again and unselect it:
            await contentBrowsePanel.clickOnRowByName(SITE.displayName);
            await contentBrowsePanel.pause(1000);
            // 4. Select the site in the second time:
            await contentBrowsePanel.clickOnRowByName(SITE.displayName);
            // 5. Verify that Preview button is enabled:
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
        });

    it("WHEN 'Edit' menu item has been clicked for a text component THEN 'close edit mode' icon gets visible in LiveEdit",
        async () => {
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            let pageComponentView = new PageComponentView();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. Click on the text-component:
            await pageComponentView.clickOnComponent(TEST_TEXT_2);
            await textComponentInspectionPanel.waitForOpened();
            // 3. Select 'Edit' menu item
            await pageComponentView.openMenu(TEST_TEXT_2);
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.EDIT]);
            // 4. Verify that close edit mode button is displayed:
            await contentWizard.switchToLiveEditFrame();
            await liveFormPanel.waitForCloseEditModeButtonDisplayed();
            // 5. Click on 'Close edit mode' button:
            await liveFormPanel.clickOnCloseEditModeButton();
            await liveFormPanel.waitForCloseEditModeButtonNotDisplayed();
            await contentWizard.switchToMainFrame();
            // 6. Verify that 'Save' and 'Apply' button remain disabled
            await contentWizard.waitForSaveButtonDisabled();
            await textComponentInspectionPanel.waitForApplyButtonDisabled();
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
