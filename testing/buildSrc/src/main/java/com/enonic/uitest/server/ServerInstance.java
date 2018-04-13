package com.enonic.uitest.server;

import java.io.File;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.List;

public final class ServerInstance
{
    private final static String LAUNCHER_CLASS = "com.enonic.xp.launcher.impl.LauncherImpl";

    private final static String[] LAUNCHER_ARGS = {"clean"};

    private File installDir;

    private Object instance;

    private long startupDelay = 20000;

    public void setInstallDir( final File value )
    {
        this.installDir = value;
    }

    public void setStartupDelay( final long value )
    {
        this.startupDelay = value;
    }

    public void start()
        throws Exception
    {
        System.setProperty( "xp.install", this.installDir.getAbsolutePath() );

        final ClassLoader loader = createClassLoader();
        final Constructor constructor = Class.forName( LAUNCHER_CLASS, true, loader ).getConstructor( String[].class );
        System.out.println( constructor.toString() );
        try
        {
            this.instance = constructor.newInstance( new Object[]{LAUNCHER_ARGS} );
        }
        catch ( InvocationTargetException e )
        {
            System.out.println( e.getMessage() );
        }
        this.instance.getClass().getMethod( "start" ).invoke( this.instance );

        Thread.sleep( this.startupDelay );
    }

    public void stop()
        throws Exception
    {
        this.instance.getClass().getMethod( "stop" ).invoke( this.instance );
    }

    private ClassLoader createClassLoader()
        throws Exception
    {
        return new URLClassLoader( getLibUrls(), ClassLoader.getSystemClassLoader() );
    }

    private URL[] getLibUrls()
        throws Exception
    {
        final List<URL> list = new ArrayList<>();
        final File libDir = new File( this.installDir, "lib" );
        final File[] children = libDir.listFiles();

        if ( children != null )
        {
            for ( final File child : children )
            {
                if ( child.isFile() && child.getName().endsWith( ".jar" ) )
                {
                    list.add( child.toURI().toURL() );
                }
            }
        }

        return list.toArray( new URL[list.size()] );
    }
}
