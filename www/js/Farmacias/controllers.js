angular.module('starter.controllersfarmacia', [])

        .controller('mapaFarmaciaCtrl', function ($scope, $compile, $ionicLoading, $ionicPopup, $timeout, $ionicPopover, $cordovaNetwork) {

            ///VARIABLES GLOBALES
            var dirServFarmacias = "http://www.diplez.com/WebserviceAri/public/farmacia/getAll/";//direccion url para obtener todas las farmacias del servidor
            var dirServHorarios = "http://www.diplez.com/WebserviceAri/public/farmacia/getAllHorarios/";//direccion url para obtener los horarios de las farmacias del servidor
            var dirServTurnos = "http://www.diplez.com/WebserviceAri/public/farmacia/getAllTurnos/";//direccion url para obtener  las farmacias de turno del servidor
            var datosTemporales = new Array(); //arreglo para guardas los datos temporales de las farmacias
            var datosTemporalesHorarios = new Array(); //arreglo para guardas los datos temporales de los horarios
            var turnos = new Array();// arreglo para guardas los datos temporales de las farmacias de turno
            $scope.user = {};// Almacena la palabra ingresada por el usuairo en el buscador
            var latitud = 0; // Variable que almacena la latitud del usuario
            var longitud = 0; // Variable que almacena la longitud del usuario
            var fechaDispositivo = new Date().toJSON().slice(0, 10);//Variable que devuelve la fecha del dispositivo
            var radio = 7;// variable del rango de busqueda. Por defecto inicia en 10
            var datosNavigator = "";//variable que guarda la posicion de la farmacia.
            var markerUsuario = 0;// Variable del marcador del usuario
            var prev_infowindow = false;// Variable para verificar el estado(abierta o cerrada) de la ventana de informacion
            var datosTemporales;//variable para guardar una farmacia
            var datosTemporalesTurno = new Array();//variable auxiliar para guardar farmacias de turno
            var datosRutas = new Array();
            var recordAux;//variable auxiliar para guardar una farmacia
            var banderaCargar = true;

            var autocompletado_nombres_farmacia = new Array();
            var marcadores = new Array();
            var datosMarcador = new Array();

            // Función que se ejecuta cuando la aplicacion ha iniciado y cargar el mapa
            $scope.mapa = function () {
                mensaje = 'Cargando farmacias a ' + radio + ' km de su ubicación';
                alertaCargando(mensaje);
                localizarUsuario();
            };

            function cargaUsuario() {
                var myIcon = L.icon({
                    iconUrl: 'img/usuario.png',
                    iconAnchor: [22, 94],
                    popupAnchor: [-3, -96],
                });
                var market = L.marker([latitud, longitud], {icon: myIcon}).addTo(map);           
                datosMarcador[0] = market;
                marcadores[0] = L.latLng(latitud, longitud);
            }

            var map = null;
            var osmUrl = "";

            //Funcion que obtiene la ubicacion del usuario y dibija el marcador en el mapa
            function localizarUsuario() {
                navigator.geolocation.getCurrentPosition(function (position) {
                    latitud = position.coords.latitude;
                    longitud = position.coords.longitude;
                    osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                            osm = L.tileLayer(osmUrl, {maxZoom: 18, attribution: osmAttrib});                            
                    if (map === null) {
                        map = L.map('map3').setView([latitud, longitud], 17).addLayer(osm);
                    }

                    // ELIMINA MARCADORES
                    for (var i = 0; i < datosMarcador.length; i++) {
                        map.removeLayer(datosMarcador[i]);
                    }                                        
                    
                    datosMarcador = new Array();
                    marcadores = new Array();
                    cargaUsuario();
                    //Carga los marcadores en el mapa recibe la posicion del usuario
                    obtenerFarmacias(position.coords.latitude, position.coords.longitude);
                    
                }, function (error) {
                    $ionicLoading.hide();
                    activarGPS();

                }, {maximumAge: 3000, timeout: 5000, enableHighAccuracy: true});
            }

            // Función  que obtiene las farmacias del webservice que se encuentran a 10 km del usuario          
            // llama a la funcion cargarMarcadores para visualizarlos en el mapa
            function obtenerFarmacias(lat, lon) {
                $.getJSON(dirServHorarios + lat + "/" + lon + "/" + radio, function (records) {
                    datosTemporalesHorarios = records;
                });
                $.getJSON(dirServFarmacias + lat + "/" + lon + "/" + radio, function (records) {
                    if (JSON.stringify(records.result).length === 2) {
                        $ionicLoading.hide();
                        banderaCargar = false;
                        var mensaje = 'No existe farmacias a ' + radio + ' km de su ubicación';
                        alertaMensaje(mensaje, "Aceptar", "Mensaje");
                    } else {
                        datosTemporales = records.result;
                        cargarMarcodores(records.result, "img/marcadorFarmacia.png");
                    }
                }).fail(function (e) {
                    banderaCargar = false;
                    mensaje = "Lo sentimos, actualmente existen problemas con el servidor. Intente mas tarde";
                    alertaMensaje(mensaje, "Aceptar", "Mensaje")
                    $ionicLoading.hide();
                });
            }

            var popupFarmacia;

            //Función para cargar los macadores en el mapa y añadir la informacion de la farmacia en contenedor del marcador
            function cargarMarcodores(farmacia, datoImagen) {
                mensaje = 'Cargando farmacias a ' + radio + ' km de su ubicación';
                alertaCargando(mensaje);
                for (var i = 0; i < farmacia.length; i++) {
                    autocompletado_nombres_farmacia[i] = farmacia[i].nombreSucursal;
                    var customOptions = {
                        'maxWidth': '500',
                        'className': 'custom'
                    };
                    var myIcon = L.icon({
                        iconUrl: datoImagen,
                        iconAnchor: [22, 94],
                        popupAnchor: [-3, -96],
                    });
                    marcadores[i + 1] = L.latLng(parseFloat(farmacia[i].latitud), parseFloat(farmacia[i].longitud));
                    popupFarmacia = L.popup()
                            .setLatLng(L.latLng(parseFloat(farmacia[i].latitud), parseFloat(farmacia[i].longitud)))
                            .setContent(formatoInformacionFarmacia(farmacia[i]));
                    var market = L.marker([parseFloat(farmacia[i].latitud), parseFloat(farmacia[i].longitud)], {icon: myIcon}).addTo(map).bindPopup(popupFarmacia, customOptions).on("popupopen", informacionVentana);
                    datosMarcador[i + 1] = market;
                }
                map.fitBounds(marcadores);
                $ionicLoading.hide();
            }

            // Función que agrega la información a la ventana del marcador
            // Recibe de parametros el marcador y un objeto farmacia
            function informacionVentana() {
                var tempMarker = this;
                var farmacia = $('#origen').text();
                datosNavigator = farmacia.split("===")[1];

                // To remove marker on click of delete
                $("#nombreFar:visible").click(function (event) {
                    event.preventDefault();
                    var datosHorario = "</div>";
                    var contador = 0;
                    for (var i = 0; i < datosTemporalesHorarios.result.length; i++) {
                        var datos = datosTemporalesHorarios.result[i];
                        if (datos.nombreSucursal === $('#nombreFar').text()) {
                            datosHorario += datos.descripcion + ": " + datos.horaInicioHorario.split(":")[0] + ":" + datos.horaInicioHorario.split(":")[1] + " a " + datos.horaFinHorario.split(":")[0] + ":" + datos.horaFinHorario.split(":")[1] + "<br/>";
                            contador++;
                        }
                    }
                    if (contador === 0) {
                        datosHorario = "<center><b>Sin asiganar</b></center>"
                    }
                    var mensaje =
                            "<div id='contenido-info' style='margin-top: 4%;'>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-location' style='font-size:20px; color: red'></i> " + $('#direccion').text() + "</div>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-ios-telephone' style='font-size:20px; color: red'></i>  " + $('#telefono').text() + "</div>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-map' style=' font-size:20px; color: red'></i>  " + $('#distancia').text() + "</div>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-clock' style='font-size:20px; color: red'></i> Horarios:" + datosHorario + "</div>"
                            + "</div> ";
                    ventanaFlotanteInformacion(mensaje, $('#nombreFar').text(), $('#origen').text().split("=")[0], $('#origen').text().split("=")[1]);
                });
            }

            //Función para obtener la informacion de la farmacia
            function formatoInformacionFarmacia(farmacia) {
                return '<div>' +
                        '<div class="iw-title">' +
                        "<label id='nombreFar' style='background:none; color:white;font-size: 12px; font-weight: bold; font-family: 'Times New Roman', Times, serif;'>"
                        + farmacia.nombreSucursal + "</label>" +
                        "<label id='idSucursal'   style='display: none;background:none;'> "
                        + farmacia.idSucursal + "</label>" +
                        "<label id='direccion'   style='display: none;background:none;'> "
                        + farmacia.direccion + "</label>" +
                        "<label id='telefono'   style='display: none;background:none;'>"
                        + farmacia.telefono + "</label>" +
                        "<label id='distancia'   style='display: none;background:none;'>" + ' Aproximadamente a ' +
                        +(parseFloat(farmacia.distancia).toFixed(2)) + ' km ' + "</label>" + '</div>' +
                        '</div>' +
                        "<div id='origen' style='display: none;'>" + farmacia.latitud + "=" + farmacia.longitud + "===" + farmacia.latitud + ',' + farmacia.longitud;
                +'</div>';
            }


            // Función que muestra los datos de los farmacias en una ventana flotante
            //recibe como parametros mensaje:contiene la informacion de la farmacia, cabecera: nombre de la farmacia
            function ventanaFlotanteInformacion(mensaje, cabecera, latF, lonF) {
                var confirmPopup = $ionicPopup.confirm({
                    title: cabecera,
                    template: mensaje,
                    cancelText: '¿Cómo Llegar?',
                    okText: 'Aceptar'
                });
                confirmPopup.then(function (res) {
                    if (!res) {
                        for (var i = 0; i < datosMarcador.length; i++) {
                            map.removeLayer(datosMarcador[i]);
                        }            
                        datosRutas[0] = L.latLng(latitud,longitud);
                        datosRutas[1] = L.latLng(latF,lonF);
                        L.Routing.control({
                            waypoints: [
                                datosRutas[0],
                                datosRutas[1]        
                            ]
                        }).addTo(map);
                    }
                });
                for (var i = 0; i < datosMarcador.length; i++) {
                    datosMarcador[i].closePopup();
                }
            }

            //Función que carga la farmacia que el usuario mando a buscar
            function cargarMarcadoresPorNombre(lat, lon, nombre) {
                // ELIMINA MARCADORES
                for (var i = 0; i < datosMarcador.length; i++) {
                    map.removeLayer(datosMarcador[i]);
                }
                datosMarcador = new Array();
                marcadores = new Array();
                cargaUsuario();
                var listaFarmacia = new Array();
                for (var i = 0; i < datosTemporales.length; i++) {
                    var rgxp = new RegExp(nombre, "gi");
                    if (datosTemporales[i].nombreSucursal.match(rgxp) !== null) {
                        listaFarmacia.push(datosTemporales[i]);
                        cargarMarcodores(listaFarmacia, "img/marcadorFarmacia.png");
                    }
                }

                if (listaFarmacia.length <= 0) {
                    banderaCargar = true;
                    mensaje = "No se ha encontrado ninguna farmacia con las iniciales ingresadas. Por favor vuelva a intentarlo";
                    alertaMensaje(mensaje, "Aceptar", "Mensaje");
                    $scope.user.nombre = "";
                }

            }

            //Funcion que carga todos las farmacias de turno
            $scope.turnoFarmacia = function () {
                $('#map3').css('height', '100%');
                loadMarkersPorTurno(latitud, longitud);
                $('.rangoTurno').hide();
            };

            //Funcion que carga las farmacias que estan de turno a 10 km de la ubicacion del usuario
            function loadMarkersPorTurno(lat, lon) {
                $('.buscador').hide();
                $('#menu').css('height', '170px');
                mensaje = 'Cargando farmacias de Turno a ' + radio + ' km de su ubicación';
                alertaCargando(mensaje);
                $.getJSON(dirServTurnos + lat + "/" + lon + "/" + radio, function (turnos) {
                    if (JSON.stringify(turnos.result).length === 2) {
                        $ionicLoading.hide();
                        banderaCargar = false;
                        var mensaje = "No hay farmacias de Turno a " + radio + " KM de su ubicación";
                        alertaMensaje(mensaje, "Aceptar", "Mensaje");
                        $scope.user.nombre = "";

                    } else {
                        for (var i = 0; i < datosMarcador.length; i++) {
                            map.removeLayer(datosMarcador[i]);
                        }
                        datosMarcador = new Array();
                        marcadores = new Array();
                        cargaUsuario();
                        autocompletado_nombres_farmacia = [];
                        for (var i = 0; i < turnos.result.length; i++) {
                            //record = datosTemporalesTurno.result[i];
                            if ((fechaDispositivo >= turnos.result[i].fechaInicio) && (fechaDispositivo <= turnos.result[i].fechaFin)) {
                                for (var j = 0; j < datosTemporales.length; j++) {
                                    if (turnos.result[i].idSucursal === datosTemporales[j].idSucursal) {
                                        datosTemporalesTurno.push(datosTemporales[j]);
                                        break;
                                    }
                                }
                            }
                        }
                        cargarMarcodores(datosTemporalesTurno, "img/marcadorTurno.png");
                        datosTemporalesTurno = [];
                    }
                }).done(function () {
                    $ionicLoading.hide();
                }).fail(function (e) {
                    mensaje = "Lo sentimos, actualmente existen problemas con el servidor. Intente mas tarde";
                    alertaMensaje(mensaje, "Aceptar", "Mensaje");
                    banderaCargar = false;
                    $ionicLoading.hide();
                });
                ;
            }

            //Cambia el rango de búsqueda de las farmacias
            $scope.cambiarRango = function () {
                $scope.data = {rad: 5};
                var myPopup = $ionicPopup.show({
                    template: '<table style="width:100%"><tr><th style="width: 70%;"><input type="range" min="1" max="5" value"5" ng-model="data.rad" ></th><th style="padding-left: 7%"><h4>{{data.rad}} Km</h4></th><tr></table>',
                    title: 'Cambiar rango de búsqueda',
                    subTitle: 'Rango entre: 1 a 5 Km',
                    scope: $scope,
                    buttons: [
                        {text: 'Cancelar'},
                        {
                            text: 'Aceptar',
                            type: 'button-positive',
                            onTap: function (e) {
                                $scope.popover.hide();
                                return $scope.data.rad;
                            }
                        }
                    ]
                });
                myPopup.then(function (res) {
                    if (parseInt(res) > 0 && parseInt(res) < 21) {
                        autocompletado_nombres_farmacia = [];
                        radio = parseInt(res);
                        $scope.mapa();
                    } else {
                        $scope.popover.hide();
                    }
                });
            };
            $ionicPopover.fromTemplateUrl('popover.html', {
                scope: $scope,
                "backdropClickToClose": true
            }).then(function (popover) {
                $scope.popover = popover;
            });
            //Abre el menu lateral de la pantalla principal
            $scope.openPopover = function ($event) {
                $scope.popover.show($event);
            };

            //Funcion permite cargar todas las farmacias
            $scope.cargarTodasFarmacias = function () {
                $scope.user.nombre = "";
                $('.buscador').show();
                radio = 5;
                $('#map3').css('height', '93%');
                $('.rangoTurno').show();
                $('#menu').css('height', '220px');
                $scope.mapa();
                autocompletado_nombres_farmacia = [];
            };


            // Centra la ubicacion del usuario en el mapa
            $scope.ubicar = function () {
                
                alert(datosRutas.length);                                
                for (var i = 0; i < datosRutas.length; i++) {
                    var marketRuta = L.marker([latitud, longitud]);
                        map.removeLayer(marketRuta);
                    } 
                    L.Routing.control({
                            waypoints: [
                                datosRutas[0],
                                datosRutas[1]        
                            ]
                        }).removeTo(map);
//                map.panTo(L.latLng(latitud, longitud));
//                map.fitBounds([marcadores[0]]);
            };

            //Funcion que permite buscar por nombre a las farmacias
            $scope.buscadorText = function () {
                setTimeout(function () {
                    if ($scope.user.nombre !== "") {
                        cargarMarcadoresPorNombre(latitud, longitud, $scope.user.nombre);
                        $scope.user.nombre = "";
                    }
                }, 1000, "JavaScript");
            };
            //Función para realizar el autocompletado de búsqueda
            $("#tags").autocomplete({
                source: autocompletado_nombres_farmacia,
                select: function (event, ui) {
                    setTimeout(function () {
                        cargarMarcadoresPorNombre(latitud, longitud, ui.item.value);
                        $scope.user.nombre = "";
                    }, 500, "JavaScript");
                }
            });
            //Funcion que abre google maps navegation
            $scope.abrirNavigator = function () {
                //q: establece el punto de llegada para búsquedas de navegación.
                window.open("http://maps.google.com/maps?saddr=" + latitud + "," + longitud + "&daddr=" + datosNavigator, '_system');

                //window.open('geo:0,0?q=' + datosNavigator+"(Direccion)", '_system');
            };

            // Método que proporciona información sobre el la aplicacion de farmacias
            $scope.ayuda = function () {
                mensaje = "El módulo de farmacias ofrece las opciones: <br><br>1. Visulizar la/las farmacias de turno que se encuentren a 20 km del usuario.</br>2. Visualizar la información y ruta de las farmacias. " +
                        "<br>3. Buscar la/las farmacias por nombre.</br></br>" +
                        "<b style='color: red'>PASOS:</b> </br>" +
                        "</br><b><center>VISUALIZAR INFORMACIÓN DEL FARMACIA</center></b>" +
                        "1. Presionar un marcador que represente una farmacia.</br>2. Presionar la ventana con el nombre de la farmacia. </br>" +
                        "</br><b><center>CAMBIAR RADIO DE BÚSQUEDA </center></b>" +
                        "1. En la parte superior derecha se observa un menú. </br>2. Elegir la opción  <b>Cambiar Rango</b>." +
                        "<b><center></br>TRAZAR RUTA</i></center></b>" +
                        "1. Ver información. </br>2.Presionar el botón <b>¿Cómo Llegar?.</b><br>" + "3. Abrirá la aplicaión de <b>Google Maps</b><br>" +
                        "<br><b><center>BUSCAR FARMACIA</center></b>" +
                        "1. Ingresar el nombre de la farmacia en el buscador.</br>2. Presionar en el botón <b>buscar</b>. </br>" +
                        "<b><center> </br>VISUALIZAR FARMACIAS DE TURNO</center></b>" +
                        "1. En la parte superior derecha se observa un menú. </br>2. Elegir la opción  <b>Farmacias de Turno</b>.";
                alertaMensaje(mensaje, "Entendido", "<div class='ion-help-circled' style='text-align: left;'> Ayuda</div>");
                banderaCargar = false;
            };

            // Método para mostrar los mensajes de cargando farmacias
            function alertaCargando(mensaje) {
                $scope.loading = $ionicLoading.show({
                    content: 'gfg',
                    template: '<ion-spinner icon="bubbles"> </ion-spinner> </br>' + mensaje,
                    showBackdrop: true
                });
            }
            // Método para mostrar los avisos de alertas
            function alertaMensaje(mensaje, btnMensaje, cabecera) {
                $scope.alertPopup = $ionicPopup.alert({
                    title: cabecera,
                    template: mensaje,
                    okText: btnMensaje
                });
                $scope.alertPopup.then(function (res) {
                    $scope.popover.hide();
                    $('.buscador').show();
                    $scope.user.nombre = "";
                    if (banderaCargar) {
                        $scope.mapa();
                        radio = 5;
                    }
                });
            }

            function activarGPS() {
                cordova.plugins.locationAccuracy.canRequest(function (canRequest) {
                    if (canRequest) {
                        cordova.plugins.locationAccuracy.request(function () {
                        }, function (error) {
                            if (error) {
                                if (error.code !== cordova.plugins.locationAccuracy.ERROR_USER_DISAGREED) {
                                }
                            }
                        }, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY // iOS will ignore this
                                );
                    }
                    localizarUsuario();
                    $ionicLoading.hide();
                });
            }
        });

