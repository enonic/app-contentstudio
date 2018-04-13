var stk = require('stk/stk');
var menu = require('menu');
var util = require('utilities');

var portal = require('/lib/xp/portal');

exports.get = handleGet;

function handleGet(req) {
    var me = this;

    function renderView() {
        var view = resolve('home.html');
        var model = createModel();
        return stk.view.render(view, model);
    }

    function createModel() {

        var up = req.params;
        var site = portal.getSite();
        var menuItems = menu.getSiteMenu(3);
        var siteConfig = portal.getSiteConfig();
        stk.data.deleteEmptyProperties(siteConfig);

        var content = portal.getContent();

        var bodyClass = '';
        var backgroundImage;
        if (siteConfig.backgroundImage) {
            var bgImageUrl = portal.imageUrl({
                id: siteConfig.backgroundImage,
                scale: '(1,1)',
                format: 'jpeg'
            });

            backgroundImage = '<style type="text/css" id="custom-background-css">body.custom-background { background-image: url("' +
                              bgImageUrl +
                              '"); background-repeat: repeat; background-position: top left; background-attachment: scroll; }</style>';

            bodyClass += 'custom-background ';
        }
        if ((content._path == site._path) && stk.data.isEmpty(up)) {
            bodyClass += 'home blog ';
        }
        if (up.cat || up.tag || up.author) {
            bodyClass += ' archive ';
        }
        if (content.type == app.name + ':post' || content.type == 'portal:page-template') {
            bodyClass += 'single single-post single-format-standard ';
        }
        if (up.author) {
            bodyClass += 'author '
        }

        var footerText = siteConfig.footerText ? portal.processHtml({value: siteConfig.footerText}) : 'Configure footer text.';


        var model = {
            site: site,
            bodyClass: bodyClass,
            backgroundImage: backgroundImage,
            mainRegion: content.page.regions['main'],
            content: content,
            menuItems: menuItems,
            footerText: footerText,
            headerStyle: req.mode == 'edit' ? 'position: absolute;' : null
        }

        return model;
    }

    return renderView();
}