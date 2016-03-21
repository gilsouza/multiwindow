// Uses AMD or browser globals to create a jQuery plugin.

// It does not try to register in a CommonJS environment since
// jQuery is not likely to run in those environments.
// See jqueryPluginCommonJs.js for that version.

/*
// https://developers.google.com/maps/documentation/javascript/reference
TODO:
- Diminuir acesso a objetos. Manter referencia localmente.
- Melhorar metodo refresh. Loop muito custoso.
- Criar dicionario de makers.
- Ajustar para mais configuracoes.
- Mapear metodos.
- Mapear publicos e privados.
- MVVM e bind de eventos para uso do observable.
**/

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'kendo'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, window.kendo);
    }
}(function ($, kendo) {
    
    // referencias locais. performance e melhor leitura. 
    var ui = kendo.ui,
        Widget = ui.Widget,
        CHANGE = "change",
        markers = [], // devera ser um dicionario e n de array
        infoWindows = [];

    var Map = Widget.extend({

        init: function(element, options) {
            console.log("init");

            var that = this;

            // Dependencia Google Maps
            if (!window.google) {
                kendo.logToConsole("Ops! Parece que voce nao possui a biblioteca Google Maps library carregada.");
            }
            else {
                // Chamada base de inicializacao de um wigget kendo
                Widget.fn.init.call(this, element, options);

                // Define um padrao para template do marker se passado em options
                if (that.options.marker.template)
                    that.template = kendo.template(that.options.marker.template);

                // Cria as opcoes padroes do mapa
                that._mapOptions = {
                    zoom: 8,
                    center: new google.maps.LatLng("-22.836946", "-43.195496"),
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };

                // criacao do mapa com o uso de $.deferred que quando resolved executa that._dataSource
                // ao chamar then()
                that._createMap().then(function() {
                    that._dataSource();
                });
            }
        },

        options: {    
            // the name is what it will appear as off the kendo namespace(i.e. kendo.ui.YouTube). 
            // The jQuery plugin would be jQuery.fn.kendoYouTube.
            name: "Map",
            // faz com que a leitura do datasource seja feita logo em seguida
            // a sua criacao atraves do metodo feth().
            autoBind: true,
            panTo: false, // anima ate o marker inserido
            groupBy: null, // recebe o nome do campo a ser agrupado
            latField: "lat", // padrao de texto para o nome do campo latitude no dataSource
            lngField: "lng", // // padrao de texto para o nome do campo longitude no dataSource
            addressField: "address", // padrao de texto para o nome do campo endereco no dataSource
            fitBounds: false, // fara com que o centro e o zoom do mapa sejam reajustados se necessario
            // configuracao do maps
            map: {
                options: {}
            },
            // configuracao dos marker's
            marker: {
                options: {},
                template: null // template para infoview. por padrao n ha infoview
            }
        },

        refresh: function() {
            console.log("refresh");

            var that = this,
                view = that.dataSource.view(),
                fitBounds = false,
                options = that.options;

            // objeto necessario para api do google
            that.bounds = new google.maps.LatLngBounds();
            //that.map.clearOverlays();

            that.removeAllMarker();

            // interacao e criacao dos marker's que estao no datasource
            $.each(view, function(index, item) {
                if (item.items)
                    item = item.items[0];

                // fitBounds sera aplicado ao final da ultima interacao
                if ( index === view.length - 1 && options.fitBounds ) {
                    fitBounds = true;
                }

                //checa se existe endereco, se existir usa geocode
                // TODO: funcao dentro de loop. melhorar!
                if (item[options.addressField]) {
                    that.geocode(item[options.addressField]).then(function(results, status) {
                        that.dropMarker(results[0].geometry.location, item, fitBounds);
                    });
                }
                else {
                    if (item[options.latField] && item[options.lngField]) {
                        var latlng = new google.maps.LatLng(item[options.latField], item[options.lngField]);
                        that.dropMarker(latlng, item, fitBounds);
                    }
                }
            });
        },

        _createMap: function() {
            console.log("_createMap");

            var that = this,
                options = that.options.map.options,
                dfr = $.Deferred(); // execucao 'assincrona' incluida na v1.5 de jquery

            $.extend(true, that._mapOptions, options); // merge de opcoes privadas com as passadas pelo options

            if (options.center) {
                //checa se existe endereco, se existir usa geocode
                if ($.type(options.center) !== "string") {
                    // cria o mapa com o primeiro elemento caso exista mais elementos
                    // seletor jquery pode retornar mais de um elemento
                    that._mapOptions.center = new google.maps.LatLng(options.center.lat, options.center.lng);
                    that.map = new google.maps.Map(that.element[0], that._mapOptions);
                    dfr.resolve();
                } 
                else {
                    that.geocode(options.center).then(function(results) {
                        that._mapOptions.center = results[0].geometry.location;
                        that.map = new google.maps.Map(that.element[0], that._mapOptions);
                        dfr.resolve();
                    });
                }
            }
            else {
                that.map = new google.maps.Map(that.element[0], that._mapOptions);
                dfr.resolve();
            }
        
            return dfr.promise();        
        },

        geocode: function (address) {
            console.log("geocode");

            var that = this,
            dfr = $.Deferred();
                
            that._geocoder = that._geocoder || new google.maps.Geocoder();

            that._geocoder.geocode({ 'address': address }, dfr.resolve);

            return dfr.promise();
        },

        dropMarker: function (latlng, data, fitBounds) {
            console.log("dropMarker");

            var that = this;

            // marke options
            that._markerOptions = { map: that.map, position: latlng };

            // extend the options onto the required options
            $.extend(that._markerOptions, that.options.marker.options);

            // cria marker
            var marker = new google.maps.Marker(that._markerOptions);  

            // TODO: adiciona no dicionario, e n array.... para manipulacao
            markers.push(marker);

            // uso do template para o marker
            if (data && that.template) {
                that._infoWindow(marker, data);         
            }

            // TODO: revidar uso da extensao para incluir o marcador
            that.bounds.extend(latlng);

            if (fitBounds) {
                // Animara ate os bounds estarem visiveis
                // if (that.options.panTo) that.map.panToBounds(that.bounds);
                that.map.fitBounds(that.bounds); // ajusta para que todos aparecam em tela
                //that._zoom();
            }
        },

        removeAllMarker: function () {
            for (var i = 0; i < markers.length; i++) {
                if (markers[i]) markers[i].setMap(null);
            }
            markers = [];
        },

        removeMarker: function(marker) {
            if (!marker) markers.pop().setMap(null);
        },

        _zoom: function() {
            console.log("_zoom");

            var that = this;

            if (that._mapOptions.zoom) {
                var listener = google.maps.event.addListener(that.map, "idle",  function() { 
                    that.map.setZoom(that._mapOptions.zoom);
                    google.maps.event.removeListener(listener); 
                });
            }

        },

        _infoWindow: function (marker, data) {
            console.log("_infoWindow");

            var that = this,
                html = kendo.render(that.template, [ data ]);

            var infoWindow = new google.maps.InfoWindow({
                content: html
            });

            google.maps.event.addListener(marker, "click", function() {
                infoWindow.open(that.map, marker);
            });
        },

        _dataSource: function() {
            console.log("_dataSource");

            var that = this;

            // retorna ou cria datasource com array ou objeto passado
            that.dataSource = kendo.data.DataSource.create(that.options.dataSource);
            
            // TODO: um dos metodos do datasource: em teste
            if (that.options.groupBy) {
                that.dataSource.group({ field: that.options.groupBy });
            }

            // evento para mudanca do datasource que levara a sua atualizacao
            that.dataSource.bind(CHANGE, function (e) {
                console.log(e.items);
                that.refresh();
            });

            if (that.options.autoBind) {
                // fetch() le os dados apenas apenas na primeira vez.
                // read() leria todas as vezes, na presenca de um request
                that.dataSource.fetch();
            }
        }

    });

    //registra plugin no namespace do kendo.ui
    ui.plugin(Map);

}));