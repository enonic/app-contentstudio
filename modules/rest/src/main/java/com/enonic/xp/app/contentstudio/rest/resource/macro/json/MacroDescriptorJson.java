package com.enonic.xp.app.contentstudio.rest.resource.macro.json;

import com.google.common.base.Preconditions;

import com.enonic.xp.app.contentstudio.json.form.FormJson;
import com.enonic.xp.app.contentstudio.rest.resource.macro.MacroIconUrlResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.content.LocaleMessageResolver;
import com.enonic.xp.app.contentstudio.rest.resource.schema.mixin.InlineMixinResolver;
import com.enonic.xp.macro.MacroDescriptor;

import static com.google.common.base.Strings.nullToEmpty;

public class MacroDescriptorJson
{
    private final String key;

    private final String name;

    private final String displayName;

    private final String description;

    private final FormJson form;

    private final String iconUrl;

    private final String displayNameI18nKey;

    private final LocaleMessageResolver localeMessageResolver;

    private final String descriptionI18nKey;

    public MacroDescriptorJson( final Builder builder )
    {
        Preconditions.checkNotNull( builder.localeMessageResolver );
        Preconditions.checkNotNull( builder.macroIconUrlResolver );
        Preconditions.checkNotNull( builder.macroDescriptor );

        this.localeMessageResolver = builder.localeMessageResolver;

        this.key = builder.macroDescriptor.getKey().toString();
        this.name = builder.macroDescriptor.getName();
        this.displayName = builder.macroDescriptor.getDisplayName();
        this.displayNameI18nKey = builder.macroDescriptor.getDisplayNameI18nKey();
        this.descriptionI18nKey = builder.macroDescriptor.getDescriptionI18nKey();
        this.description = builder.macroDescriptor.getDescription();
        this.form = new FormJson( builder.macroDescriptor.getForm(), builder.localeMessageResolver, builder.inlineMixinResolver );
        this.iconUrl = builder.macroIconUrlResolver.resolve( builder.macroDescriptor );
    }

    public String getKey()
    {
        return key;
    }

    public String getName()
    {
        return name;
    }

    public String getDisplayName()
    {
        if ( !nullToEmpty( displayNameI18nKey ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( displayNameI18nKey, displayName );
        }
        else
        {
            return displayName;
        }
    }

    public String getDescription()
    {
        if ( !nullToEmpty( descriptionI18nKey ).isBlank() )
        {
            return localeMessageResolver.localizeMessage( descriptionI18nKey, description );
        }
        else
        {
            return description;
        }
    }

    public FormJson getForm()
    {
        return form;
    }

    public String getIconUrl()
    {
        return iconUrl;
    }

    public static Builder create()
    {
        return new Builder();
    }

    public static class Builder
    {
        private MacroDescriptor macroDescriptor;

        private MacroIconUrlResolver macroIconUrlResolver;

        private LocaleMessageResolver localeMessageResolver;

        private InlineMixinResolver inlineMixinResolver;

        public Builder setMacroDescriptor( final MacroDescriptor macroDescriptor )
        {
            this.macroDescriptor = macroDescriptor;
            return this;
        }

        public Builder setMacroIconUrlResolver( final MacroIconUrlResolver macroIconUrlResolver )
        {
            this.macroIconUrlResolver = macroIconUrlResolver;
            return this;
        }

        public Builder setLocaleMessageResolver( final LocaleMessageResolver localeMessageResolver )
        {
            this.localeMessageResolver = localeMessageResolver;
            return this;
        }

        public Builder setInlineMixinResolver( final InlineMixinResolver inlineMixinResolver )
        {
            this.inlineMixinResolver = inlineMixinResolver;
            return this;
        }

        public MacroDescriptorJson build()
        {
            return new MacroDescriptorJson( this );
        }
    }
}
