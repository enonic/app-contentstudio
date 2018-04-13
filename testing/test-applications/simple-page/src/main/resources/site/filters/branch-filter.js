var portal = require('/lib/xp/portal');

exports.responseFilter = function (req, res) {

    var isHtml = (res.contentType.lastIndexOf('text/html', 0) === 0);
    if (isHtml) {
        addPageContribution(res, 'bodyEnd', '<input type="hidden" name="branch" value="' + req.branch + '"/>');
    }

    var scriptUrl = portal.assetUrl({path: 'filters/branch-filter.js'});
    addPageContribution(res, 'bodyEnd', '<script src="' + scriptUrl + '" type="text/javascript"></script>');

    return res;
};

var addPageContribution = function (response, tagPos, contribution) {
    var pageContributions = response.pageContributions || {};
    response.pageContributions = pageContributions;
    var contributions = pageContributions[tagPos] || [];
    contributions = [].concat(contributions);
    pageContributions[tagPos] = contributions;
    contributions.push(contribution);
};
