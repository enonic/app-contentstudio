/**
 * Created on 25.02.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ImageInspectPanel = require('../../page_objects/wizardpanel/liveform/inspection/image.inspection.panel');
const LayoutInspectPanel = require('../../page_objects/wizardpanel/liveform/inspection/layout.inspection.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertImageDialog = require('../../page_objects/wizardpanel/insert.image.dialog.cke');

describe('Generate name for fragments  specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let CONTROLLER_NAME = 'main region';
    let TEST_IMAGE_NAME = appConstant.TEST_IMAGES.FOSS;


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.SIMPLE_SITE_APP], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/1455 Text component name should be sanitised
    it(`GIVEN an image is inserted in text-component WHEN the component has been saved as fragment THEN expected fragment-name should be generated`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let insertImageDialog = new InsertImageDialog();
            //1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Insert new text-component
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItemAndCloseDialog(["Insert", "Text"]);
            await textComponentCke.switchToLiveEditFrame();
            //3. Open 'Insert Image' dialog and insert an image in htmlArea:
            await textComponentCke.clickOnInsertImageButton();
            await insertImageDialog.filterAndSelectImage(TEST_IMAGE_NAME);
            await insertImageDialog.clickOnInsertButton();
            //4. Save the text-component as fragment:
            await contentWizard.clickOnShowComponentViewToggler();
            await pageComponentView.openMenu("Text");
            await pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.pause(700);
            await studioUtils.doSwitchToNewWizard();
            //5. Verify the generated display name:
            let fragmentContent = await contentWizard.getDisplayName();
            assert.equal(fragmentContent, "Text", "Expected display name should be generated in Fragment-Wizard");
        });

    //Verifies -  xp/issues/7831, Component Names - generate proper names for Fragment component #7831
    it(`GIVEN an layout component is inserted WHEN the empty layout has been saved as fragment THEN expected fragment-name should be generated`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            //1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //2. Insert new layout-component
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Layout"]);
            //3. Save the empty layout-component as fragment:
            await pageComponentView.openMenu("Layout");
            await pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.pause(700);
            await studioUtils.doSwitchToNewWizard();
            //4. Verify the generated display name(should be 'Layout'):
            let fragmentContent = await contentWizard.getDisplayName();
            assert.equal(fragmentContent, "Layout", "Expected display name should be generated in Fragment-Wizard");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp()
    );
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome()
    );
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
