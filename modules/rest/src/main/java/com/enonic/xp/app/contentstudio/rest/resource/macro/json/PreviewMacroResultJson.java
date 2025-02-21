package com.enonic.xp.app.contentstudio.rest.resource.macro.json;

import com.enonic.xp.macro.Macro;
import com.enonic.xp.portal.PortalResponse;

public final class PreviewMacroResultJson
{
    private final PageContributionsJson pageContributions;

    private final String html;

    private final String macroStr;

    private final boolean success;

    public PreviewMacroResultJson( final Macro macro, final PortalResponse response )
    {
        html = response != null && response.getBody() instanceof String ? (String) response.getBody() : "";
        pageContributions = new PageContributionsJson( response );
        macroStr = macro.toString();
        success = response == null || response.getStatus() == null || response.getStatus().is2xxSuccessful();
    }

    public PageContributionsJson getPageContributions()
    {
        return pageContributions;
    }

    public String getHtml()
    {
        return html;
    }

    public String getMacro()
    {
        return macroStr;
    }

    public boolean isSuccess()
    {
        return success;
    }
}
