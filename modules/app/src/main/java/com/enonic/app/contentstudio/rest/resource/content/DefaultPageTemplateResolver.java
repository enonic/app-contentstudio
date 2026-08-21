package com.enonic.app.contentstudio.rest.resource.content;

import java.util.HashMap;
import java.util.Map;

import com.enonic.xp.content.Content;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentIds;
import com.enonic.xp.content.ContentPath;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.content.GetContentByIdsParams;
import com.enonic.xp.page.GetDefaultPageTemplateParams;
import com.enonic.xp.page.PageTemplate;
import com.enonic.xp.page.PageTemplateService;
import com.enonic.xp.schema.content.ContentTypeName;
import com.enonic.xp.site.Site;

/**
 * Resolves the page templates that contents render with without pointing at them. A content with no page of its own falls back to the
 * default template of its site, resolved by content type, and that fallback is never written to the content - which leaves it invisible to
 * the reference based dependency resolution behind publishing. Publishing such a content without its template renders a 404, so the
 * template has to be looked up the same way the renderer looks it up.
 */
public class DefaultPageTemplateResolver
{
    private final ContentService contentService;

    private final PageTemplateService pageTemplateService;

    public DefaultPageTemplateResolver( final ContentService contentService, final PageTemplateService pageTemplateService )
    {
        this.contentService = contentService;
        this.pageTemplateService = pageTemplateService;
    }

    public ContentIds resolve( final ContentIds contentIds )
    {
        if ( contentIds.isEmpty() )
        {
            return ContentIds.empty();
        }

        final Map<ContentPath, Site> sites = new HashMap<>();
        final Map<TemplateLookup, ContentId> templates = new HashMap<>();
        final ContentIds.Builder result = ContentIds.create();

        for ( final Content content : contentService.getByIds( GetContentByIdsParams.create().contentIds( contentIds ).build() ) )
        {
            if ( !rendersWithDefaultPageTemplate( content ) )
            {
                continue;
            }

            final Site site = resolveSite( content, sites );
            if ( site == null )
            {
                continue;
            }

            final ContentId templateId = resolveTemplate( new TemplateLookup( site, content.getType() ), templates );
            if ( templateId != null )
            {
                result.add( templateId );
            }
        }

        return result.build();
    }

    /**
     * Mirrors the fallback in the renderer's page resolution: a content that brings its own page, and one that is never rendered through a
     * template to begin with, resolves without the default template.
     */
    private static boolean rendersWithDefaultPageTemplate( final Content content )
    {
        final ContentTypeName type = content.getType();
        return content.getPage() == null && !type.isPageTemplate() && !type.isTemplateFolder() && !type.isFragment() &&
            !type.isShortcut();
    }

    /**
     * Contents sharing a parent share a nearest site, and a publish tends to hold many of them, so the walk up the tree is done once per
     * parent rather than once per content.
     */
    private Site resolveSite( final Content content, final Map<ContentPath, Site> sites )
    {
        if ( content.isSite() )
        {
            return (Site) content;
        }

        final ContentPath parentPath = content.getParentPath();
        if ( sites.containsKey( parentPath ) )
        {
            return sites.get( parentPath );
        }

        final Site site = contentService.getNearestSite( content.getId() );
        sites.put( parentPath, site );
        return site;
    }

    private ContentId resolveTemplate( final TemplateLookup lookup, final Map<TemplateLookup, ContentId> templates )
    {
        if ( templates.containsKey( lookup ) )
        {
            return templates.get( lookup );
        }

        final PageTemplate template = pageTemplateService.getDefault( GetDefaultPageTemplateParams.create()
                                                                          .site( lookup.site.getId() )
                                                                          .sitePath( lookup.site.getPath() )
                                                                          .contentType( lookup.contentType )
                                                                          .build() );

        final ContentId templateId = template == null ? null : template.getId();
        templates.put( lookup, templateId );
        return templateId;
    }

    private static final class TemplateLookup
    {
        private final Site site;

        private final ContentTypeName contentType;

        private TemplateLookup( final Site site, final ContentTypeName contentType )
        {
            this.site = site;
            this.contentType = contentType;
        }

        @Override
        public boolean equals( final Object o )
        {
            if ( this == o )
            {
                return true;
            }
            if ( !( o instanceof TemplateLookup ) )
            {
                return false;
            }
            final TemplateLookup that = (TemplateLookup) o;
            return site.getId().equals( that.site.getId() ) && contentType.equals( that.contentType );
        }

        @Override
        public int hashCode()
        {
            return 31 * site.getId().hashCode() + contentType.hashCode();
        }
    }
}
