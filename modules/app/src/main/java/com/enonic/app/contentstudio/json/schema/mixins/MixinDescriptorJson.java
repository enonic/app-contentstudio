package com.enonic.app.contentstudio.json.schema.mixins;

import java.time.Instant;

import com.google.common.base.Preconditions;

import com.enonic.app.contentstudio.json.ItemJson;
import com.enonic.app.contentstudio.json.form.FormJson;
import com.enonic.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.app.contentstudio.rest.resource.schema.mixin.CmsFormFragmentResolver;
import com.enonic.xp.schema.mixin.MixinDescriptor;

import static com.google.common.base.Strings.nullToEmpty;

public class MixinDescriptorJson
    implements ItemJson
{
    private final MixinDescriptor mixinDescriptor;

    private final Boolean isOptional;

    private final LocaleMessageResolver localeMessageResolver;

    private final CmsFormFragmentResolver formFragmentResolver;

    public MixinDescriptorJson( final Builder builder )
    {
        Preconditions.checkNotNull( builder.localeMessageResolver );
        Preconditions.checkNotNull( builder.inlineMixinResolver );

        this.mixinDescriptor = builder.mixinDescriptor;
        this.isOptional = builder.isOptional;
        this.localeMessageResolver = builder.localeMessageResolver;
        this.formFragmentResolver = builder.inlineMixinResolver;
    }

    public static Builder create()
    {
        return new Builder();
    }

    public String getName()
    {
        return mixinDescriptor.getName() != null ? mixinDescriptor.getName().toString() : null;
    }

    public String getDisplayName()
    {
        if ( !nullToEmpty( mixinDescriptor.getDisplayNameI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( mixinDescriptor.getDisplayNameI18nKey(), mixinDescriptor.getDisplayName() );
        }
        else
        {
            return mixinDescriptor.getDisplayName();
        }
    }

    public String getDescription()
    {
        if ( !nullToEmpty( mixinDescriptor.getDescriptionI18nKey() ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( mixinDescriptor.getDescriptionI18nKey(), mixinDescriptor.getDescription() );
        }
        else
        {
            return mixinDescriptor.getDescription();
        }
    }

    public Instant getCreatedTime()
    {
        return mixinDescriptor.getCreatedTime();
    }

    public Instant getModifiedTime()
    {
        return mixinDescriptor.getModifiedTime();
    }

    public FormJson getForm()
    {
        return new FormJson( mixinDescriptor.getForm(), this.localeMessageResolver, this.formFragmentResolver );
    }

    public String getCreator()
    {
        return mixinDescriptor.getCreator() != null ? mixinDescriptor.getCreator().toString() : null;
    }

    public String getModifier()
    {
        return mixinDescriptor.getModifier() != null ? mixinDescriptor.getModifier().toString() : null;
    }

    public Boolean getIsOptional()
    {
        return isOptional;
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

    public static final class Builder
    {
        private MixinDescriptor mixinDescriptor;

        private Boolean isOptional = false;

        private LocaleMessageResolver localeMessageResolver;

        private CmsFormFragmentResolver inlineMixinResolver;

        private Builder()
        {
        }

        public Builder setMixinDescriptor( final MixinDescriptor mixinDescriptor )
        {
            this.mixinDescriptor = mixinDescriptor;
            return this;
        }

        public Builder setOptional( final Boolean optional )
        {
            isOptional = optional;
            return this;
        }

        public Builder setLocaleMessageResolver( final LocaleMessageResolver localeMessageResolver )
        {
            this.localeMessageResolver = localeMessageResolver;
            return this;
        }

        public Builder setInlineMixinResolver( final CmsFormFragmentResolver inlineMixinResolver )
        {
            this.inlineMixinResolver = inlineMixinResolver;
            return this;
        }

        private void validate()
        {
            Preconditions.checkNotNull( localeMessageResolver );
            Preconditions.checkNotNull( inlineMixinResolver );
        }

        public MixinDescriptorJson build()
        {
            validate();
            return new MixinDescriptorJson( this );
        }
    }

}
