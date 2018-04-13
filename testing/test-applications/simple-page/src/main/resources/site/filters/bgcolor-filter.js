var portal = require('/lib/xp/portal');

exports.responseFilter = function (req, res) {

    var isHtml = (res.contentType.lastIndexOf('text/html', 0) === 0);
    if (isHtml && res.body) {
        var siteConfig = portal.getSiteConfig();
        var bgColor = "#FFFFFF";
        switch (siteConfig.backgroundColor) {
        case 'grey':
            bgColor = '#EEEEEE';
            break;
        case 'white':
            bgColor = '#FFFFFF';
            break;
        case 'red':
            bgColor = '#D59392';
            break;
        case 'blue':
            bgColor = '#F0F8FF';
            break;
        default:
            bgColor = '#FFFFFF';
        }
        res.body = res.body.replace(/<body([^>]+)>/ig, '<body$1 style="background-color:' + bgColor + '">');
    }

    return res;
};
