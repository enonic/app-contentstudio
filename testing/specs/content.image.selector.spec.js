/**
 * Created on 15.12.2017.
 *
 * ImageSelector content - options in dropdown list should be correctly filtered #628
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const ImageSelectorForm = require('../page_objects/wizardpanel/imageselector.form.panel');

describe('content.image.selector: Image content specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let imageSelectorContent;
    let FOLDER_WITH_FILES = 'selenium-tests-folder';

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for image-selector is opened WHEN 'zzzzzz' typed in the filter input THEN 'No matching items' should appear`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4);
            await imageSelectorForm.doFilterOptions('zzzzzz');
            //wait for the message:
            let isDisplayed = await imageSelectorForm.waitForEmptyOptionsMessage();
            studioUtils.saveScreenshot('img_empty_options1');
            assert.isTrue(isDisplayed, "No matching items - this message should appear");
        });

    it(`GIVEN wizard for image-selector is opened and actual name is typed in filter input WHEN 'zzzzzz' string has been typed in the filter input THEN 'No matching items' should appears`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4);
            //1. Type an existing name
            await imageSelectorForm.doFilterOptions(appConstant.TEST_IMAGES.SPUMANS);
            //2. Type a not existing name:
            await imageSelectorForm.doFilterOptions('zzzzzz');
            let isDisplayed = await imageSelectorForm.waitForEmptyOptionsMessage();
            studioUtils.saveScreenshot('img_empty_options2');
            assert.isTrue(isDisplayed, "No matching items - this message should appear");
        });

    it(`GIVEN wizard for image-selector is opened WHEN 'mode toggler' button has been pressed THEN mode should be switched to 'Tree' and expected folder with images should be present in the options`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4);
            //Switch to Tree-mode:
            await imageSelectorForm.clickOnModeTogglerButton();
            let options = await imageSelectorForm.getTreeModeOptionDisplayNames();
            studioUtils.saveScreenshot('img_sel_tree_mode');
            assert.strictEqual(options[0], appConstant.TEST_FOLDER_WITH_IMAGES);
        });

    it(`GIVEN wizard for image-selector is opened WHEN 'dropdown handle' button has been pressed THEN flat mode should be present in the options list`,
        () => {
            let imageSelectorForm = new ImageSelectorForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4).then(() => {
                return imageSelectorForm.clickOnDropdownHandle();
            }).then(() => {
                studioUtils.saveScreenshot("selector_flat_mode");
                return imageSelectorForm.getFlatModeOptionImageNames();
            }).then(imagesNames => {
                studioUtils.saveScreenshot('img_sel_flat_mode');
                assert.isTrue(imagesNames.length > 0, 'images should be present in the dropdown list');
                assert.isTrue(imagesNames[0].includes('.png') || imagesNames[0].includes('.jpg') || imagesNames[0].includes('.jpeg') ||
                              imagesNames[0].includes('.svg'),
                    'expected extension should be in the name');
            });
        });

    //verifies https://github.com/enonic/lib-admin-ui/issues/628
    it(`GIVEN wizard for image-selector is opened WHEN filter a folder with multiple contents and one content is image THEN one option should be present in the dropdown list`,
        () => {
            let imageSelectorForm = new ImageSelectorForm();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_1_1).then(() => {
                return imageSelectorForm.doFilterOptions(FOLDER_WITH_FILES);
            }).then(() => {
                return imageSelectorForm.getFlatModeOptionImageNames();
            }).then(imagesNames => {
                studioUtils.saveScreenshot('img_sel_filtered');
                assert.isTrue(imagesNames.length == 1,
                    'only one option should be present in options, because text files should be filtered');
                assert.isTrue(imagesNames[0].includes('.svg'), 'pdf and text- files should be filtered in drop down list');
            });
        });

    it(`GIVEN wizard for content with image-selector is opened WHEN an image has been selected AND Save pressed THEN new content should be listed in the grid`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let images = [appConstant.TEST_IMAGES.RENAULT];
            let displayName = contentBuilder.generateRandomName('imgselector');
            imageSelectorContent =
                contentBuilder.buildContentWithImageSelector(displayName, appConstant.contentTypes.IMG_SELECTOR_2_4, images);
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, imageSelectorContent.contentType);
            await contentWizard.typeData(imageSelectorContent);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.doCloseWizardAndSwitchToGrid();

            await studioUtils.typeNameInFilterPanel(imageSelectorContent.displayName);
            //'the content should be listed in the grid'
            await contentBrowsePanel.waitForContentDisplayed(imageSelectorContent.displayName);
            //Red icon should be displayed in the grid, because 2 images are required:
            await contentBrowsePanel.isRedIconDisplayed(imageSelectorContent.displayName);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
