package com.enonic.xp.app.contentstudio.rest.resource.application.json;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import com.google.common.collect.ImmutableList;

import com.enonic.xp.app.Application;
import com.enonic.xp.app.ApplicationDescriptor;
import com.enonic.xp.app.contentstudio.json.ItemJson;
import com.enonic.xp.app.contentstudio.json.form.FormJson;
import com.enonic.xp.app.contentstudio.rest.resource.application.ApplicationIconUrlResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.formfragment.CmsFormFragmentResolver;
import com.enonic.xp.idprovider.IdProviderDescriptor;
import com.enonic.xp.site.CmsDescriptor;

public class ApplicationJson
    implements ItemJson
{
    private final Application application;

    private final ApplicationDescriptor applicationDescriptor;

    private final boolean local;

    private final FormJson config;

    private final FormJson idProviderConfig;

    private final ImmutableList<String> metaStepMixinNames;

    private final String iconUrl;

    public ApplicationJson( final Builder builder )
    {
        this.application = builder.application;
        this.applicationDescriptor = builder.applicationDescriptor;
        this.local = builder.local;

        this.config =
            builder.cmsDescriptor != null && builder.cmsDescriptor.getForm() != null ? new FormJson( builder.cmsDescriptor.getForm(),
                                                                                                     builder.localeMessageResolver,
                                                                                                     builder.inlineMixinResolver ) : null;

        this.idProviderConfig = builder.idProviderDescriptor != null && builder.idProviderDescriptor.getConfig() != null ? new FormJson(
            builder.idProviderDescriptor.getConfig(), builder.localeMessageResolver, builder.inlineMixinResolver ) : null;

        if ( builder.cmsDescriptor != null && builder.cmsDescriptor.getMixinMappings() != null )
        {
            this.metaStepMixinNames = ImmutableList.copyOf( builder.cmsDescriptor.getMixinMappings().
                stream().
                map( mixinMapping -> mixinMapping.getMixinName().toString() ).
                distinct().
                collect( Collectors.toList() ) );
        }
        else
        {
            this.metaStepMixinNames = ImmutableList.of();
        }
        this.iconUrl = builder.iconUrlResolver.resolve( application.getKey(), applicationDescriptor );
    }

    public String getKey()
    {
        return application.getKey().toString();
    }

    public String getVersion()
    {
        return application.getVersion().toString();
    }

    public String getDisplayName()
    {
        return application.getDisplayName();
    }

    public String getMaxSystemVersion()
    {
        return application.getMaxSystemVersion();
    }

    public String getMinSystemVersion()
    {
        return application.getMinSystemVersion();
    }

    public String getUrl()
    {
        return application.getUrl();
    }

    public String getVendorName()
    {
        return application.getVendorName();
    }

    public String getVendorUrl()
    {
        return application.getVendorUrl();
    }

    public Instant getModifiedTime()
    {
        return this.application.getModifiedTime();
    }

    public String getState()
    {
        return this.application.isStarted() ? "started" : "stopped";
    }

    public boolean getLocal()
    {
        return local;
    }

    public FormJson getConfig()
    {
        return config;
    }

    public FormJson getIdProviderConfig()
    {
        return idProviderConfig;
    }

    public List<String> getMetaSteps()
    {
        return metaStepMixinNames;
    }

    public String getDescription()
    {
        return applicationDescriptor == null ? "" : applicationDescriptor.getDescription();
    }

    public String getIconUrl()
    {
        return iconUrl;
    }

    @Override
    public boolean getDeletable()
    {
        return false;
    }

    @Override
    public boolean getEditable()
    {
        return false;
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static class Builder
    {
        private Application application;

        private ApplicationDescriptor applicationDescriptor;

        private CmsDescriptor cmsDescriptor;

        private IdProviderDescriptor idProviderDescriptor;

        private ApplicationIconUrlResolver iconUrlResolver;

        private LocaleMessageResolver localeMessageResolver;

        private CmsFormFragmentResolver inlineMixinResolver;

        private boolean local;

        public ApplicationJson build()
        {
            return new ApplicationJson( this );
        }

        public Builder setApplication( final Application application )
        {
            this.application = application;
            return this;
        }

        public Builder setApplicationDescriptor( final ApplicationDescriptor applicationDescriptor )
        {
            this.applicationDescriptor = applicationDescriptor;
            return this;
        }

        public Builder setCmsDescriptor( final CmsDescriptor cmsDescriptor )
        {
            this.cmsDescriptor = cmsDescriptor;
            return this;
        }

        public Builder setIdProviderDescriptor( final IdProviderDescriptor idProviderDescriptor )
        {
            this.idProviderDescriptor = idProviderDescriptor;
            return this;
        }

        public Builder setIconUrlResolver( final ApplicationIconUrlResolver iconUrlResolver )
        {
            this.iconUrlResolver = iconUrlResolver;
            return this;
        }

        public Builder setLocaleMessageResolver( final LocaleMessageResolver localeMessageResolver )
        {
            this.localeMessageResolver = localeMessageResolver;
            return this;
        }

        public Builder setCmsFormFragmentResolver( final CmsFormFragmentResolver resolver )
        {
            this.inlineMixinResolver = resolver;
            return this;
        }

        public Builder setLocal( final boolean local )
        {
            this.local = local;
            return this;
        }

    }

}
