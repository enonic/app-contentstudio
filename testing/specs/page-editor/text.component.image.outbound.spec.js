/**
 * Created on 01.02.2019.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentFilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertImageDialog = require('../../page_objects/wizardpanel/insert.image.dialog.cke');

describe("text.component.image.outbound.spec: Inserts a text component with an image and checks Outbound dependencies",
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME = 'kotey';
        let SITE;
        let CONTROLLER_NAME = 'main region';

        it(`Preconditions: new site should be created`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
                await studioUtils.doAddSite(SITE);
            });

        it(`GIVEN text component with an image is inserted WHEN Show Outbound button has been pressed THEN the image should be filtered in the new browser tab`,
            async () => {
                let pageComponentView = new PageComponentView();
                let contentWizard = new ContentWizard();
                let textComponent = new TextComponentCke();
                let contentFilterPanel = new ContentFilterPanel();
                let insertImageDialog = new InsertImageDialog();
                let contentBrowsePanel = new ContentBrowsePanel();
                //1. Open existing site:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                //automatic template does not exist, so no need to unlock the editor
                await contentWizard.clickOnShowComponentViewToggler();
                //2. Insert new text component:
                await pageComponentView.openMenu("main");
                await pageComponentView.selectMenuItemAndCloseDialog(["Insert", "Text"]);
                await contentWizard.switchToLiveEditFrame();
                await textComponent.clickOnInsertImageButton();
                //3. Insert an image in the text component:
                await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
                await insertImageDialog.clickOnInsertButton();
                await insertImageDialog.waitForDialogClosed();
                await contentWizard.waitAndClickOnSave();
                await contentWizard.waitForNotificationMessage();
                //3. Open dependencies widget
                let wizardDependenciesWidget = await studioUtils.openWizardDependencyWidget();
                //4. Click on Show Outbound button:
                await wizardDependenciesWidget.clickOnShowOutboundButton();
                await studioUtils.doSwitchToNextTab();
                //5. 'Dependencies Section' should be present, in the filter panel'
                await contentFilterPanel.waitForDependenciesSectionVisible();
                    await studioUtils.saveScreenshot('text_component_outbound');
                let result = await contentBrowsePanel.getDisplayNamesInGrid();

                assert.equal(result[0], IMAGE_DISPLAY_NAME, 'expected display name of dependency');
                assert.equal(result.length, 1, 'One content should be present in the grid');
            });


        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
