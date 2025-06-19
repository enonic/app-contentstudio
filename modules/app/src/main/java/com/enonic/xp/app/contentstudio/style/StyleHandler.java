package com.enonic.xp.app.contentstudio.style;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import com.enonic.xp.app.ApplicationKey;
import com.enonic.xp.app.ApplicationKeys;
import com.enonic.xp.content.ContentConstants;
import com.enonic.xp.content.ContentId;
import com.enonic.xp.content.ContentService;
import com.enonic.xp.context.ContextAccessor;
import com.enonic.xp.context.ContextBuilder;
import com.enonic.xp.i18n.LocaleService;
import com.enonic.xp.project.ProjectName;
import com.enonic.xp.project.ProjectService;
import com.enonic.xp.script.bean.BeanContext;
import com.enonic.xp.script.bean.ScriptBean;
import com.enonic.xp.site.Site;
import com.enonic.xp.site.SiteConfig;
import com.enonic.xp.site.SiteConfigs;
import com.enonic.xp.style.StyleDescriptorService;
import com.enonic.xp.style.StyleDescriptors;

public final class StyleHandler
    implements ScriptBean
{
    private static final ApplicationKey SYSTEM_APPLICATION_KEY = ApplicationKey.from( "com.enonic.xp.app.system" );

    private StyleDescriptorService styleDescriptorService;

    private ContentService contentService;

    private ProjectService projectService;

    private LocaleService localeService;

    private String contentId;

    private String project;

    private List<Locale> locales;

    public StyleDescriptorMapper getStyles()
    {
        return ContextBuilder.from( ContextAccessor.current() )
            .repositoryId( ProjectName.from( project ).getRepoId() )
            .branch( ContentConstants.BRANCH_DRAFT )
            .build()
            .callWith( () -> {
                final ContentId contentId = ContentId.from( this.contentId );

                final ApplicationKeys applicationKeys = resolveKeysFromApps( contentId );

                final StyleDescriptors styles = this.styleDescriptorService.getByApplications( applicationKeys );

                return new StyleDescriptorMapper( styles, localeService, locales );
            } );
    }

    private ApplicationKeys resolveKeysFromApps( final ContentId contentId )
    {
        final Set<ApplicationKey> keys = new LinkedHashSet<>();
        keys.add( SYSTEM_APPLICATION_KEY );

        final Site nearestSite = this.contentService.getNearestSite( contentId );

        final SiteConfigs siteConfigs = nearestSite != null
        ? nearestSite.getSiteConfigs()
        : projectService.get( ProjectName.from( ContextAccessor.current().getRepositoryId() ) ).getSiteConfigs();

        final Set<ApplicationKey> contentApps = this.getSiteConfigsApplicationKeys( siteConfigs );

        contentApps.stream().filter( applicationKey -> !isSystemApp( applicationKey ) ).forEach( keys::add );

        return ApplicationKeys.from( keys );
    }

    private Set<ApplicationKey> getSiteConfigsApplicationKeys( final SiteConfigs siteConfigs )
    {
        return siteConfigs.stream().map( SiteConfig::getApplicationKey ).collect( Collectors.toSet() );
    }

    private boolean isSystemApp( final ApplicationKey key )
    {
        return ApplicationKey.SYSTEM_RESERVED_APPLICATION_KEYS.contains( key );
    }

    public void setContentId( final String contentId )
    {
        this.contentId = contentId;
    }

    public void setProject( final String value )
    {
        this.project = value;
    }

    public void setLocales( final List<String> locales )
    {
        this.locales = locales.stream().map( Locale::forLanguageTag ).toList();
    }

    @Override
    public void initialize( final BeanContext context )
    {
        styleDescriptorService = context.getService( StyleDescriptorService.class ).get();
        contentService = context.getService( ContentService.class ).get();
        projectService = context.getService( ProjectService.class ).get();
        localeService = context.getService( LocaleService.class ).get();
    }

}
