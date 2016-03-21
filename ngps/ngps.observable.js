var Observable = Class( function () {
    "use stric";
    var _listeners = {},
        _handlers = [];

    return {
        $statics: {
            WINAPP_OPEN: "WINAPP_OPEN",
            WINAPP_CLOSE: "WINAPP_CLOSE",
            WINAPP_LOAD: "WINAPP_LOAD",
            WINAPP_UNLOAD: "WINAPP_UNLOAD",
            WINAPP_RESIZE: "WINAPP_RESIZE",
            WIN_OPEN: "WIN_OPEN",
            WIN_CLOSE: "WIN_CLOSE",
            WIN_LOAD: "WIN_LOAD",
            WIN_UNLOAD: "WIN_UNLOAD",
            WIN_RESIZE: "WIN_RESIZE",
            WINMAP_OPEN: "WINMAP_OPEN",
            WINMAP_CLOSE: "WINMAP_CLOSE",
            WINMAP_LOAD: "WINMAP_LOAD",
            WINMAP_UNLOAD: "WINMAP_UNLOAD",
            WINMAP_RESIZE: "WINMAP_RESIZE",
            MAP_REQUEST: "MAP_REQUEST",
            MAP_READY: "MAP_READY",
            MAP_SELECT: "MAP_SELECT",
            TABSTRIP_LOAD: "TABSTRIP_LOAD",
            TABSTRIP_SELECT: "TABSTRIP_SELECT",
            TABSTRIP_ADDTAB: "TABSTRIP_ADDTAB",
            TABSTRIP_REMOVETAB: "TABSTRIP_REMOVETAB",
        },
        listen: function ( type, method, scope, context ) {
            if ( typeof method !== "function" ) throw new Error( "Callback inválido" );
            if ( !this[type] ) throw new Error( "Evento não definido" );

            var listeners, handlers, scope, id;

            listeners = _listeners;
            id = new Date().getTime();
            scope = ( scope ? scope : window );

            if ( !listeners.hasOwnProperty( type ) )
                handlers = listeners[type] = [];
            else
                handlers = listeners[type];

            handlers.push( {
                id: id,
                method: method,
                scope: scope,
                context: ( context ? context : scope )
            } );

            return id;
        },
        unlisten: function () {
            throw new Error( "não implementado" );
        },
        fireEvent: function ( type, data, context ) {
            var listeners, handlers, i, n, handler, scope;
            if ( !( listeners = _listeners ) ) {
                return;
            }
            if ( !( handlers = listeners[type] ) ) {
                return;
            }
            for ( i = 0, n = handlers.length; i < n; i++ ) {
                handler = handlers[i];
                if ( typeof ( context ) !== "undefined" && context !== handler.context ) continue;
                if ( handler.method.call( handler.scope, { type: type, data: data, id: handler.id } ) === false ) { // o metodo assinado para escuta receberá sempre um objeto!!!
                    return false;
                }
            }
            return true;
        },
        cancelEvent: function () {
            throw new Error( "não implementado" );
        }
    };
} );

var ObservableFilter = Class( {
    $singleton: true,
    method: function ( item, i, array ) { return item.method === this.valueOf(); },
    scope: function ( item, i, array ) { return item.scope === this.valueOf(); },
    context: function ( item, i, array ) { return item.context === this.valueOf(); },
    type: function ( item, i, array ) { return typeof item === this.valueOf(); }
} );