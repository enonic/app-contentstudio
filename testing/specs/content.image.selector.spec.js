/**
 * Created on 15.12.2017.
 *
 * ImageSelector content - options in dropdown list should be correctly filtered #628
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const imageSelectorForm = require('../page_objects/wizardpanel/imageselector.form.panel');


describe('content.image.selector: Image content specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let imageSelectorContent;
    let FOLDER_WITH_FILES = 'selenium-tests-folder';
    it(`Precondition: WHEN site with content types has been added THEN the site should be listed in the grid`,
        () => {
            this.bail(1);
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                studioUtils.saveScreenshot('site_should_be_created');
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it(`GIVEN wizard for image-selector is opened WHEN 'mode toggler' button has been pressed THEN mode should be switched to 'Tree' and expected folder with images should be present in the options`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4).then(() => {
                return imageSelectorForm.clickOnModeTogglerButton();
            }).then(() => {
                return imageSelectorForm.getTreeModeOptionDisplayNames();
            }).then(options => {
                studioUtils.saveScreenshot('img_sel_tree_mode');
                assert.strictEqual(options[0], appConstant.TEST_FOLDER_WITH_IMAGES);
            });
        });

    it(`GIVEN wizard for image-selector is opened WHEN 'dropdown handle' button has been pressed THEN flat mode should be present in the options list`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4).then(() => {
                return imageSelectorForm.clickOnDropdownHandle();
            }).then(() => {
                return imageSelectorForm.getFlatModeOptionImageNames();
            }).then(imagesNames => {
                studioUtils.saveScreenshot('img_sel_flat_mode');
                assert.isTrue(imagesNames.length > 0, 'images should be present in the dropdown list');
                assert.isTrue(imagesNames[0].includes('.png') || imagesNames[0].includes('.jpg') || imagesNames[0].includes('.svg'),
                    'correct extension should be in the name');
            });
        });

    //verifies https://github.com/enonic/lib-admin-ui/issues/628
    it(`GIVEN wizard for image-selector is opened WHEN filter a folder with multiple contents and one content is image THEN one option should be present in the dropdown list`,
        () => {
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

    it(`GIVEN wizard for content with image-selector is opened WHEN image has been selected AND data saved THEN new content should be listed in the grid`,
        () => {
            let images = [appConstant.TEST_IMAGES.RENAULT];
            let displayName = contentBuilder.generateRandomName('imgselector');
            imageSelectorContent =
                contentBuilder.buildContentWithImageSelector(displayName, appConstant.contentTypes.IMG_SELECTOR_2_4, images);
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, imageSelectorContent.contentType).then(() => {
                return contentWizard.typeData(imageSelectorContent);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return studioUtils.doCloseWizardAndSwitchToGrid();
            }).then(() => {
                return studioUtils.typeNameInFilterPanel(imageSelectorContent.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(imageSelectorContent.displayName);
            }).then(isDisplayed => {
                studioUtils.saveScreenshot('img_sel_content_added');
                assert.isTrue(isDisplayed, 'the content should be listed in the grid');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
