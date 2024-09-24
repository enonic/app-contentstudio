/**
 * Created on 01.02.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentFilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const appConst = require('../../libs/app_const');

describe("text.component.image.outbound.spec: Inserts a text component with an image and checks Outbound dependencies", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let IMAGE_DISPLAY_NAME = appConst.TEST_IMAGES.KOTEY;
    let SITE;
    let CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN text component with an image is inserted WHEN 'Show Outbound' button has been pressed THEN the image should be filtered in the new browser tab`,
        async () => {
            let pageComponentView = new PageComponentView();
            let contentWizard = new ContentWizard();
            let textComponent = new TextComponentCke();
            let contentFilterPanel = new ContentFilterPanel();
            let insertImageDialog = new InsertImageDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // automatic template does not exist, so no need to unlock the editor
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await contentWizard.switchToLiveEditFrame();
            await textComponent.clickOnInsertImageButton();
            // 4. Insert an image in the text component:
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            await insertImageDialog.clickOnDecorativeImageRadioButton();
            await insertImageDialog.clickOnInsertButton();
            await insertImageDialog.waitForDialogClosed();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 5. Open dependencies widget
            let wizardDependenciesWidget = await studioUtils.openWizardDependencyWidget();
            // 6. Click on 'Show Outbound' button:
            await wizardDependenciesWidget.clickOnShowOutboundButton();
            await studioUtils.doSwitchToNextTab();
            // 7. 'Dependencies Section' should be present, in the filter panel'
            await contentFilterPanel.waitForDependenciesSectionVisible();
            await studioUtils.saveScreenshot('issue_text_component_outbound');
            await contentBrowsePanel.waitForSpinnerNotVisible();
            let result = await contentBrowsePanel.getDisplayNamesInGrid();

            assert.equal(result[0], IMAGE_DISPLAY_NAME, 'expected image should be filtered');
            // TODO uncomment it
            //assert.equal(result.length, 1, 'One content should be present in the grid');
        });

    it(`GIVEN existing site with outbound dependency WHEN 'Show Outbound' button has been pressed THEN the dependencies section should load no later than 3 seconds`,
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //2. Open dependencies widget
            let wizardDependenciesWidget = await studioUtils.openWizardDependencyWidget();
            //3. Click on 'Show Outbound' button:
            await wizardDependenciesWidget.clickOnShowOutboundButton();
            await studioUtils.doSwitchToNextTab();
            //4. Verify that 'Dependencies Section' should be loaded no later than 3 seconds:
            await contentFilterPanel.waitForDependenciesSectionVisible(appConst.shortTimeout);
            await studioUtils.saveScreenshot('text_component_outbound_2');
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result[0], IMAGE_DISPLAY_NAME, 'expected image should be filtered');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
