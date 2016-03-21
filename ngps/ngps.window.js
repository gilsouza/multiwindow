var WindowManager = Class( function () {
    "use strict";

    // Constantes
    // TODO: Implementacao IE http://msdn.microsoft.com/en-us/library/ie/ms536651(v=vs.85).aspx
    var WINDOW_FEATURES = "toolbar=no,menubar=0,status=0,copyhistory=0,scrollbars=yes,resizable=1,location=0,Width=300,Height=300";

    // Privados
    var instance = null,
		winAppList = [],
		winMap = null,
        observable = null,
        me = null;

    var listenEvents = function () {
        if ( !instance ) { // Não há instancia então é janela nova
            $( document ).on( "click", "input.k-button.out", function ( e ) {
                e.preventDefault();
                WindowManager.Do().requestWindowApp( e.currentTarget.offsetParent.firstChild.href, e.timeStamp.toString(), e.timeStamp.toString() );
            } );

            $( document ).on( "click", "input.k-button.in", function ( e ) {
                e.preventDefault();
                WindowManager.Do().dockWindow( window.name );
            } );
        }
    };

    return {
        $statics: {
            Do: function () {
                return window.opener ? new window.opener.WindowManager() : new WindowManager();
            }
        },

        constructor: function () {
            if ( !instance ) {
                try {
                    instance = this;
                    me = window;
                    observable = new Observable();
                } catch ( e ) {
                    console.error( e.toString() );
                }
            }
            return instance;
        },

        main: function () {
            listenEvents();
        },

        addListener: function ( type, method, scope, context ) {
            return observable.listen( type, method, scope, context );
        },

        removelistener: function () {
            return observable.unlisten();
        },

        fireEvent: function ( type, data, context ) {
            return observable.fireEvent( type, data, context );
        },

        dockWindow: function ( id ) {
            var winDock = this.getWindowApp( id );
            if ( winDock && winDock.me && winDock.me.opener ) {
                var contentOrin = winDock.getContent();
                me.document.getElementById( WindowApp.CONTENT ).innerHTML = contentOrin.innerHTML;
                this.closeWindowApp( winDock );
            }
        },

        requestWindowApp: function ( url, name, id ) {
            var newWindow = new WindowApp( url, name, WINDOW_FEATURES, id );
            listenEvents.call( newWindow.getMe() );
            winAppList.push( newWindow );
        },

        requestWindowMap: function () {
            winMap = new WindowMap( WINDOW_FEATURES );
        },

        getListWindowApp: function () {
            return winAppList;
        },

        getWindowMap: function () {
            return winMap;
        },

        getWindowApp: function ( identity, prop ) {
            if ( !prop ) prop = "id";
            return winAppList.filter( WindowFilter[prop], identity )[0];
        },

        // TODO: WinMap será fechado usando este mesmo método ? reverNome : verificarNecessidades
        closeWindowApp: function ( winApp ) {
            if ( winApp ) winApp.close();
        },

        closeAllWindowApp: function () {
            // TODO: Retirar referencias. usar retornar null, filtrar e remover.
            winAppList.forEach( this.closeWindowApp );
        },
    };
} );

var WindowClass = Class( function () {
    "use stric";
    // Privados
    var me = null,
		id = null;

    return {
        constructor: function ( url, name, windowFeatures, id ) {
            try {
                this.me = window.open( url, name, windowFeatures );
                this.id = id;
            } catch ( e ) {
                console.error( e.toString() );
            }
        },

        close: function () {
            if ( !this.me.closed ) this.me.close();
        },

        getMe: function () {
            return this.me;
        },

        getId: function () {
            return this.id;
        }
    };
} );

var WindowApp = Class( WindowClass, function () {
    "use stric";
    return {
        $statics: {
            CONTENT: "content"
        },
        constructor: function ( url, name, windowFeatures, id ) {
            WindowApp.$super.call( this, url, name, windowFeatures, id );
        },
        getContent: function () {
            return this.me.document.getElementById( this.CONTENT );
        }
    };
} );

var WindowMap = Class( WindowClass, function () {
    "use stric";
    //TODO: Hard Code
    var url = "http://localhost/NewsGPS.Web/Map/Index",
        name = "Maps",
        id = new Date().getTime(),
        instance = null,
        tabStripSelect = "#NgpsTabStripMaps",
        tabStripKName = "kendoTabStrip",
        $tabStrip = null;

    var listenEvents = function ( objWin ) {
        if ( objWin ) {
            objWin.addEventListener( "load", function () {
                this.addEventListener( "resize", function () {
                    WindowManager.Do().fireEvent( Observable.WINMAP_RESIZE );
                }, false );
            }, false );
        }
    };

    return {
        $statics: {
            Do: function () {
                return window.opener ? new window.opener.WindowMap() : new WindowMap();
            }
        },

        constructor: function ( windowFeatures ) {
            if ( !instance ) {
                if ( window.opener ) {
                    instance = WindowManager.Do().getWindowMap();
                } else {
                    instance = this;
                    WindowMap.$super.call( this, url, name, windowFeatures, id );
                    WindowManager.Do().addListener( Observable.WINMAP_RESIZE, this.resizeTabs, this )
                    this.listenEvents();
                }
            }
            return instance;
        },

        listenEvents: function () {
            listenEvents.call( instance.me, instance.me );
        },

        getTabStrip: function () {
            if ( !$tabStrip && this.me.$ ) $tabStrip = this.me.$( tabStripSelect ).data( tabStripKName );
            return $tabStrip;
        },

        resizeTabs: function () {
            var tabStrip = this.getTabStrip();
            if ( tabStrip ) {
                var tabsContent = tabStrip.contentElements.toArray();
                tabsContent.forEach( this.resizeContentTab );
            }
        },

        resizeContentTab: function ( content ) {
            console.dir( content );
        }

    };
} );

var WindowFilter = Class( {
    $singleton: true,
    id: function ( item, i, array ) { return item.id === this.valueOf(); },
    me: function ( item, i, array ) { return item.me === this.valueOf(); },
    type: function ( item, i, array ) { return typeof item === this.valueOf(); }
} );