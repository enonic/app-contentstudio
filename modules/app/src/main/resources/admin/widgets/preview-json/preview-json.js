/*global app, resolve*/

const widgetLib = require('/lib/export/widget');
const i18n = require('/lib/xp/i18n');

exports.get = function (req) {

    let params;
    try {
        params = widgetLib.validateParams(req.params);
    } catch (e) {
        return widgetLib.errorResponse(400, [i18n.localize({key: 'widget.liveview.badArguments'}), e.message]);
    }

    if (!exports.canRender(req)) {
        // needed for the head request,
        // return 418 if not able to render
        log.debug('Json [GET] can\'t render: 418');

        return widgetLib.errorResponse(418, [i18n.localize({key: 'widget.liveview.json.cantRender'})]);
    }

    try {
        const content = widgetLib.fetchContent(params.repository, params.branch, params.id || params.path);

        log.debug('Json [GET] exists: ' + !!content);

        if (content) {
            return {
                contentType: 'text/html',
                headers: {
                    'X-Frame-Options': 'SAMEORIGIN',
                    'Content-Security-Policy': "media-src 'self'"
                },
                status: 200,
                body: buildBody(content)
            };
        } else {
            return widgetLib.errorResponse(404, 'Content not found');
        }
    } catch (e) {
        log.error(`Json [GET] error: ${e.message}`);
        return widgetLib.errorResponse(500, [i18n.localize({key: 'widget.liveview.json.error'}), e.message]);
    }
}


exports.canRender = function (req) {
    try {
        const params = widgetLib.validateParams(req.params);
        const content = widgetLib.fetchContent(params.repository, params.branch, params.id || params.path);
        const canRender = !!content;

        log.debug(`Json [CAN_RENDER]: ${canRender}`);

        return canRender;
    } catch (e) {
        log.error(`Json [CAN_RENDER] error: ${e.message}`);
        return false;
    }
}

function buildBody(content) {
    return `<html lang="en"><head>
                <title>${content.displayName}</title>
                <style>
                    body {
                        background-color: #333842;
                        margin: 0;
                        display: flex;
                    }
                    pre.json {
                      flex: 1;
                      padding: 20px;
                      margin: 0;
                      font-size: 16px;
                      overflow: auto;
                      color: #b3bac6;

                      .string {
                        color: #98c379;
                      }

                      .number {
                        color: #61aeee;
                      }

                      .boolean {
                        color: #c678dd;
                      }

                      .null {
                        color: #c678dd;
                      }

                      .key {
                        color: inherit;
                      }
                    }
                </style>
            </head>
            <body>
                <pre class="json">${highlightJson(content)}</pre>
            </body>
        </html>`
}

function highlightJson(json) {
    let str = JSON.stringify(json, undefined, 4);
    str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
}
