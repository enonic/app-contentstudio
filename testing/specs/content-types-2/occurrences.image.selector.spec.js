/**
 * Created on 26.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const ImageSelectorForm = require('../../page_objects/wizardpanel/imageselector.form.panel');

describe('occurrences.image.selector: tests for occurrences of image selector', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let IMG_SEL_2_4;
    let CONTENT_NAME_1 = appConst.generateRandomName('imgsel');
    let CONTENT_NAME_2 = appConst.generateRandomName('imgsel');

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for content with not required image-selector(0:0) is opened WHEN only name input has been filled THEN the content gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open wizard with not required Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_0_0);
            //2. Fill in the name input:
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            //3. The content should be valid:
            let result = await contentWizard.isContentInvalid();
            assert.isFalse(result, "The content should be valid");
        });

    it(`GIVEN wizard for content with required image-selector(1:1) is opened WHEN only name input has been filled THEN the content remains invalid`,
        async () => {
            let contentWizard = new ContentWizard();
            let imageSelectorForm = new ImageSelectorForm();
            //1. Open wizard with Image Selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_1_1);
            //2. Fill in the name input:
            await contentWizard.typeDisplayName(CONTENT_NAME_2);
            //3. The content should be invalid even before a clicking on 'Save' button:
            let result = await contentWizard.isContentInvalid();
            assert.isTrue(result, "The content should be invalid");
            await contentWizard.waitAndClickOnSave();
            //4. Validation message should appear after clicking on Save button:
            let actualMessage = await imageSelectorForm.getSelectorValidationMessage();
            assert.equal(actualMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "'This field is required' should appear");
        });

    it(`GIVEN existing content with image-selector(1:1) is opened WHEN an image has been selected THEN the content gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let imageSelectorForm = new ImageSelectorForm();
            //1. Open existing content with image-selector(1:1)
            await studioUtils.selectContentAndOpenWizard(CONTENT_NAME_2);
            //2. Select an image:
            await imageSelectorForm.filterOptionsAndSelectImage(appConst.TEST_IMAGES.SPUMANS);
            //3. The content gets valid now:
            let result = await contentWizard.isContentInvalid();
            assert.isFalse(result, "The content should be valid");
            await contentWizard.waitAndClickOnSave();
            //4. Options filter input gets not visible:
            await imageSelectorForm.waitForOptionsFilterInputNotDisplayed();
        });

    it(`WHEN content with image-selector(2:4) has been saved with one selected option THEN that content should be invalid in grid`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let images = [appConst.TEST_IMAGES.RENAULT];
            let displayName = contentBuilder.generateRandomName('imgselector');
            IMG_SEL_2_4 =
                contentBuilder.buildContentWithImageSelector(displayName, appConst.contentTypes.IMG_SELECTOR_2_4, images);
            //1. New wizard is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, IMG_SEL_2_4.contentType);
            //2. one image has been selected:
            await contentWizard.typeData(IMG_SEL_2_4);
            //3. The content has been saved:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.doCloseWizardAndSwitchToGrid();
            await studioUtils.typeNameInFilterPanel(IMG_SEL_2_4.displayName);
            //4. Verify that the content should be with red-icon in the grid, because 2 images are required:
            await contentBrowsePanel.waitForContentDisplayed(IMG_SEL_2_4.displayName);
            await contentBrowsePanel.isRedIconDisplayed(IMG_SEL_2_4.displayName);
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
