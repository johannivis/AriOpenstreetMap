angular.module('starter.controllersbancos', [])

        // CONTROLADOR DEL MAPA PRINCIPAL        
        .controller('mapaCtrl', function ($scope, $ionicLoading, $http, $state, $ionicPopup, $ionicPopover, Bancos_cercanos, $ionicHistory) {

            // VARIABLES GLOBALES
            $scope.datos_creditos = []; // Arreglo que almacena los nombres de los creditos obtenidos del webservice
            $scope.datos_bancos = []; // Arreglo que almacena los bancos obtenidos del webservice que se encuentran a 10 km
            $scope.datos_banco_aux = []; // Sirve que almacena temporalmente los datos de los bancos
            $scope.bancos_con_credito = []; // Arreglo para almacena lo bancos que tienen el credito seleccionado por el usuario
            $scope.creditos_cercanos_bancos = []; // Arreglo que almacena los datos de los creditos
            $scope.credito_seleccionado = {}; // Almacena el credito seleccionado por el usuario            
            $scope.radio = 5; //Inicializa el rango de busqueda.
            $scope.map = 0; // Variable que contiene el mapa        
            var datosTemporalesHorarios = []; //Arreglo para guardas los datos temporales de los horarios
            var latitud = 0; // Variable que almacena la latitud del usuario
            var longitud = 0; // Variable que almacena la longitud del usuario            
            var banderaUbicar = true; // Variable para la ubicacion del usuario
            var marcadores = new Array();
            var datosMarcador = new Array();
            var banderaUsuario = true;
            var map = null;
            var osmUrl = "";
            var popupBanco;

            //FUNCIONES

            $scope.mapa = function () {
                var mensaje = 'Cargando bancos a ' + $scope.radio + ' km de su ubicación';
                alertaCargando(mensaje);
                localizarUsuario();
                $('#target').unbind('mousemove');

            };

            function cargaUsuario() {
                var myIcon = L.icon({
                    iconUrl: 'img/usuario.png',
                    iconAnchor: [22, 94],
                    popupAnchor: [-3, -96],
                });
                var market = L.marker([latitud, longitud], {icon: myIcon}).addTo(map);
            }

            //Funcion que obtiene la ubicacion del usuario y dibija el marcador en el mapa
            function localizarUsuario() {
                //if ($cordovaNetwork.isOnline() === true) {                             
                navigator.geolocation.getCurrentPosition(function (position) {
                    latitud = position.coords.latitude;
                    longitud = position.coords.longitude;
                    osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                            osm = L.tileLayer(osmUrl, {maxZoom: 18, attribution: osmAttrib});
                    if (map === null) {
                        map = L.map('map').setView([latitud, longitud], 17).addLayer(osm);
                    }

                    if (banderaUsuario) {
                        cargaUsuario();
                    }
                    //Carga los marcadores en el mapa recibe la posicion del usuario
                    obtenerBancos(position.coords.latitude, position.coords.longitude);
                }, function (error) {
                    $ionicLoading.hide();
                    activarGPS();                     
                }, {maximumAge: 3000, timeout: 5000, enableHighAccuracy: true});
//                } else {
//                    mensaje = "Verifique que esté conectado a una red Wifi o sus datos móviles estén acivos, intente nuevamente más tarde.";
//                    alertaMensaje(mensaje, "Aceptar", "Compruebe su Conexión");
//                    $ionicLoading.hide();
//                }
            }

            /* Función  que obtiene los bancos del webservice que se encuentran a 10 km del usuario y
             llama a la funcion crearMarcadores para visualizarlos en el mapa */
            function obtenerBancos(latitud, longitud) {
                $http.get('http://181.198.51.178:8083/WebserviceAri/public/banco/GetBancosCercanos/' + latitud + '/' + longitud + '/' + $scope.radio).then(function (response) {
                    if (JSON.stringify(response.data.result).length == 2) {
                        $ionicLoading.hide();
                        $scope.datos_banco_aux = [];
                        var mensaje = 'No existe bancos a ' + $scope.radio + ' km de su ubicación';
                        alertaMensaje(mensaje, "Aceptar", "Mensaje");
                        map.panTo(L.latLng(latitud, longitud));
                    } else {
                        $scope.datos_bancos = response.data.result;
                        $scope.datos_banco_aux = response.data.result;
                        cargarMarcadores(response.data.result);
                        cargarCreditos();
                    }
                }).catch(function (e) {
                    $ionicLoading.hide();
                    var mensaje = "Lo sentimos, actualmente existen problemas con el servidor. Intente más tarde";
                    alertaMensaje(mensaje, "Aceptar", "Mensaje");
                });

                $http.get('http://181.198.51.178:8083/WebserviceAri/public/banco/GetHorariosCercanos/' + latitud + '/' + longitud + '/' + 1000).then(function (response) {
                    datosTemporalesHorarios = response.data.result;
                })
            }

            //Función que obtiene la lista de creditos del webservice 
            function cargarCreditos() {
                $("#target").mousemove(function (event) {
                    mensaje = "<center><i class='ion-arrow-up-a' style='font-size:20px;color: red;'></i><center>Para realizar la Simulación debe <br><b>SELECIONAR UN CREDITO  </b> ";
                    alertaBoton(mensaje);
                });

                $http.get("http://181.198.51.178:8083/WebserviceAri/public/banco/GetListaCreditos").then(function (response) {
                    $scope.datos_creditos = response.data.result;
                    Bancos_cercanos.data.lista_creditos = $scope.datos_creditos;
                })
            }

            function cargarMarcadores(bancos) {
                marcadores[0] = L.latLng(latitud, longitud);
                for (var i = 0; i < bancos.length; i++) {
                    var customOptions = {
                        'maxWidth': '500',
                        'className': 'custom'
                    };
                    var myIcon = L.icon({
                        iconUrl: 'img/banco_op1.png',
                        iconAnchor: [22, 94],
                        popupAnchor: [-3, -96],
                    });
                    marcadores[i + 1] = L.latLng(parseFloat(bancos[i].latitud), parseFloat(bancos[i].longitud));
                    popupBanco = L.popup()
                            .setLatLng(L.latLng(parseFloat(bancos[i].latitud), parseFloat(bancos[i].longitud)))
                            .setContent(informacionBanco(bancos[i]));

                    var market = L.marker([parseFloat(bancos[i].latitud), parseFloat(bancos[i].longitud)], {icon: myIcon}).addTo(map).bindPopup(popupBanco, customOptions).on("popupopen", informacionVentana);
                    datosMarcador[i] = market;
                }
                map.fitBounds(marcadores);
                $ionicLoading.hide();
            }


            function informacionVentana() {

                $("#nombre:visible").click(function (event) {
                    event.preventDefault();
                    var datosHorario = "</div>";
                    var contador = 0;
                    for (var i = 0; i < datosTemporalesHorarios.length; i++) {
                        var datos = datosTemporalesHorarios[i];
                        if (datos.nombreSucursal === $('#nombre').text()) {
                            datosHorario += datos.descripcion + ": " + datos.horaInicioHorario.split(":")[0] + ":" + datos.horaInicioHorario.split(":")[1] + " a " + datos.horaFinHorario.split(":")[0] + ":" + datos.horaFinHorario.split(":")[1] + "<br/>";
                            contador++;
                        }
                    }
                    if (contador === 0) {
                        datosHorario = "<center><b>Sin asiganar</b></center>"
                    }
                    var mensaje = "<div id='contenido-info' style='margin-top: 4%;'>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-location' style='font-size:20px; color: red'></i> " + $('#direccion').text() + "</div>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-ios-telephone' style='font-size:20px; color: red'></i>  " + $('#telefono').text() + "</div>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-map' style=' font-size:20px; color: red'></i>  " + $('#distancia').text() + " km Aproximadamente. </div>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-clock' style='font-size:20px; color: red'></i> Horarios:" + datosHorario + "</div>"
                            + "</div> ";
                    ventanaFlotanteInformacion(mensaje, $('#nombre').text(), $('#origen').text());
                });
            }


            //Función para obtener la informacion de la farmacia
            function informacionBanco(banco) {

                return '<div>' +
                        '<div class="iw-title">' +
                        "<label id='nombre' style='font-size: 12px;'>"
                        + banco.nombreSucursal + "</label>" +
                        "<label id='direccion' class='item item-icon-left'  style='display: none;background:none;'> "
                        + banco.direccion + "</label>" +
                        "<label id='telefono' class='item item-icon-left'  style='display: none;background:none;'>"
                        + banco.telefono + "</label>" +
                        "<label id='distancia' class='item item-icon-left'  style='display: none;background:none;'>"
                        + (parseFloat(banco.distance).toFixed(2)) + "</label>" + '</div>' +
                        '</div>' +
                        "<div id='origen' style='display: none;'>" + banco.latitud + "=" + banco.longitud + "===" + banco.latitud + ',' + banco.longitud + "</div>";
            }

            // Muestra la ventana flotante con la informaciçón del banco y la opción ver ruta
            // Recibe los paramentros(idBanco: contiene el id del banco, mensaje: contiene la información de banco, cabecera: nombre del banco 
            // y finalmente la latitud y longitud del banco)           
            function ventanaFlotanteInformacion(mensaje, cabecera, coordenadas) {
                var confirmPopup = $ionicPopup.confirm({
                    title: cabecera,
                    template: mensaje,
                    cancelText: '¿Cómo llegar?',
                    okText: 'Aceptar'

                });
                confirmPopup.then(function (res) {
                    if (!res) {
                        datosNavigator = coordenadas.split("===")[1];
                        $scope.abrirNavigator();
                    }
                });
                for (var i = 0; i < datosMarcador.length; i++) {
                    datosMarcador[i].closePopup();
                }
            }

            $scope.abrirNavigator = function () {
                //q: establece el punto de llegada para búsquedas de navegación.
                window.open("http://maps.google.com/maps?saddr=" + latitud + "," + longitud + "&daddr=" + datosNavigator, '_system');

                //window.open('geo:0,0?q=' + datosNavigator+"(Direccion)", '_system');
            };

            //Función que consulta en el web service los bancos con el credito seleccionado por el usuario            
            $scope.seleccionarCredito = function (id, credito) {
                $scope.credito_seleccionado = credito;
                eliminarMarcadores();
                $scope.bancos_con_credito = []; // Almacena los bancos que tienen el credito seleccionado
                $scope.creditos_cercanos_bancos = []; // Almacena el credito seleccionado correspondiente a cada banco obtenido a 10 km.

                if (credito == undefined) {
                    $scope.credito_seleccionado = 4;
                } else {
                    var mensaje = "Cargando bancos con el " + credito + ".";
                    alertaCargando(mensaje);
                    $http.get("http://181.198.51.178:8083/WebserviceAri/public/banco/GetBancosPorCredito/" + parseInt(id)).then(function (creditos) {
                        if ($scope.credito_seleccionado == credito) {
                            $ionicLoading.hide();
                            if (JSON.stringify(creditos.data.result).length == 2) {
                                mensajeCredito(credito);
                                $scope.n = 0;
                            } else {
                                for (var i = 0; i < $scope.datos_bancos.length; i++) {
                                    for (var j = 0; j < creditos.data.result.length; j++) {
                                        if ($scope.datos_bancos[i].idEmpresa === creditos.data.result[j].idEmpresa) {
                                            $scope.bancos_con_credito.push($scope.datos_bancos[i]);
                                            $scope.creditos_cercanos_bancos.push(creditos.data.result[j]);
                                        }
                                    }
                                }
                                if ($scope.bancos_con_credito.length == 0) {
                                    mensajeCredito(credito);
                                    $scope.n = 0;
                                } else {
                                    cargarMarcadores($scope.bancos_con_credito);
                                    $('#target').off('mousemove');
                                    $scope.n = 1;
                                }
                            }
                        }
                        $scope.datos_banco_aux = $scope.bancos_con_credito;
                    });
                }
            }

            // Función que envia la información obtenida del usuario a la siguiente pantalla
            $scope.calcular = function () {
                Bancos_cercanos.data.bancos = $scope.bancos_con_credito; // Se llama a la factory Bancos cercanos para almacenar los bancos que tienen el mismo credito
                Bancos_cercanos.data.creditos_bancos_cercanos = $scope.creditos_cercanos_bancos.unique(); // Se llama a la factory Bancos cercanos para almacenar los bancos que tienen el mismo credito
                Bancos_cercanos.data.credito_seleccionado = $scope.credito_seleccionado; // Se almacena en la factory Bancos_cercanos el crédito seleccionado            
                Bancos_cercanos.data.horarios = datosTemporalesHorarios;
            }

            // Función que proporciona información sobre la app
            $scope.ayuda = function () {
                mensaje = "El módulo simulador de crédito ofrece las opciones: <br><br>1. Visualizar la información y ruta de los bancos.</br>2. Simular el crédito de los bancos que se encuentren a 10 km del usuario." +
                        "<br>3. Visualizar el/los banco(os)que tiene mejor alternativa de crédito.</br></br>" +
                        "<b style='color: red'>PASOS:</b> </br>" +
                        "</br><b><center>VISUALIZAR INFORMACIÓN DEL BANCO</center></b>" +
                        "1. Presionar un marcador que represente un banco.</br>2. Presionar la ventana con el nombre del banco. </br>" +
                        "</br><b><center>CAMBIAR RADIO DE BÚSQUEDA </center></b>" +
                        "1. En la parte superior derecha se observa un menú. </br>2. Elegir la opción  <b>Cambiar Rango</b>." +
                        "<b><center></br> TRAZAR RUTA</i></center></b>" +
                        "1. Ver información. </br>2.Presionar el botón <b>¿Cómo Llegar?.</b><br>" + "3. Abrirá la aplicaión de <b>Google Maps</b><br>" +
                        "<br><b><center>SIMULAR CRÉDITO (BANCOS CERCANOS)</center></b>" +
                        "1. Seleccionar un crédito.</br>2. Presionar en el botón <b>Simular crédito</b>.</br>3. Llenar los campos del formulario. </br>4. Presionar en el botón <b>Calcular</b>. </br>" +
                        "<br><b><center>SIMULADOR DE CRÉDITO (POR BANCO O POR CREDITO)</center></b>" +
                        "1. En la parte superior derecha se observa un menú. </br>2. Elegir un simulador </br>3. Llenar los campos del formulario. </br>4. Presionar en el botón <b>Calcular</b>. </br> <b>Nota: </b> El Simulador por Crédito realiza la simulación de los bancos de todo el país. </br>" +
                        "<b><center> </br>VISUALIZAR BANCO CON MEJOR ALTERNATIVA DE CREDITO</center></b>" +
                        "1. Simular crédito (<b>Bancos Cercanos O Por Crédito</b>). </br>2. En la pantalla Resultado colocarse en la <b>Tabla Bancos</b> y buscar la <b>fila</b> de color <b>azul</b>." +
                        " <b><span style='color: red'> </br></br>NOTA:</span></b></br>  <b>La información presentada en el simulador de crédito es referencial y puede ser modificada sin previo aviso.</b>";
                alertaMensaje(mensaje, "Entendido", " <div class='ion-help-circled' style='text-align: left;'> Ayuda</div> ");
                $ionicHistory.clearCache();
            }

            // Función que centra la ubicacion del usuario en el mapa
            $scope.ubicar = function () {
                map.panTo(L.latLng(latitud, longitud));
            };

            // Función que cambia el rango de busque de los bancos 
            $scope.cambiarRango = function () {
                $scope.data = {rad: 5};
                var myPopup = $ionicPopup.show({
                    template: '<table style="width:100%"><tr><th style="width: 70%;"><input type="range" min="1" max="5" value"5" ng-model="data.rad" ></th><th style="padding-left: 7%"><h4>{{data.rad}} Km</h4></th><tr></table>',
                    title: 'Cambiar Rango de Búsqueda',
                    subTitle: 'Rango entre: 1 a 5 km',
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
                    $scope.radio = parseInt(res);
                    $('#target').unbind('mousemove');
                    eliminarMarcadores();
                    banderaUsuario = false;
                    $scope.datos_creditos = [];
                    $scope.datos_bancos = [];
                    $scope.bancos_con_credito = [];
                    $scope.creditos_cercanos_bancos = [];
                    $scope.mapa();
                    $ionicHistory.clearCache();
                    $scope.popover.hide();

                });
            };

            // Función que le envia la lista de bancos a otra vista 
            $scope.lista = function () {
                agruparPorBanco(function (bancosGeoAux) {
                    $scope.groups = [];
                    for (var i = 0; i < bancosGeoAux.length; i++) {
                        $scope.groups[i] = {
                            name: bancosGeoAux[i].split("-")[0],
                            id: bancosGeoAux[i].split("-")[1],
                            items: []
                        };
                        for (var j = 0; j < $scope.datos_banco_aux.length; j++) {
                            if (bancosGeoAux[i].split("-")[1] === $scope.datos_banco_aux[j].idEmpresa) {
                                $scope.groups[i].items.push($scope.datos_banco_aux[j]);

                            }
                        }
                    }
                })
            }

            function agruparPorBanco(callback) {
                var bancosGeo = [];
                if ($scope.datos_banco_aux.length != 0) {
                    Bancos_cercanos.data.bancos = $scope.datos_banco_aux;
                    for (var i = 0; i < $scope.datos_banco_aux.length; i++) {
                        bancosGeo.push($scope.datos_banco_aux[i].nombreEmpresa + "-" + $scope.datos_banco_aux[i].idEmpresa);
                    }

                    callback(bancosGeo.unique());
                    Bancos_cercanos.data.creditos_bancos_cercanos = $scope.groups;
                    $state.go('app.listaBancos');
                } else {
                    alertaBoton("No existen bancos en el mapa.");
                }
            }

            function eliminarMarcadores() {
                for (var i = 0; i < datosMarcador.length; i++) {
                    map.removeLayer(datosMarcador[i]);
                }
                datosMarcador = new Array();
                marcadores = new Array();
            }

            // Adapta el mapa a la pantalla del dispositivo
            /*            $scope.$on("$ionicView.enter", function () {
             google.maps.event.trigger($scope.map, 'resize');
             });*/

            // Abre el marcador del banco seleccionado
            $scope.$on('$ionicView.beforeEnter', function () {
                if (Bancos_cercanos.estado) {
                    var banco = Bancos_cercanos.banco_ubicacion;
                    map.setView(new L.LatLng(parseFloat(banco.latitud).toFixed(6), parseFloat(banco.longitud).toFixed(6)), 17);
                    Bancos_cercanos.estado = false;

                }
            });


            $ionicPopover.fromTemplateUrl('popover.html', {
                scope: $scope,
                "backdropClickToClose": true
            }).then(function (popover) {
                $scope.popover = popover;
            });

            $scope.openPopover = function ($event) {
                $scope.popover.show($event);
            };


            // Función que elimina los bancos repetidos
            Array.prototype.unique = function (a) {
                return function () {
                    return this.filter(a)
                }
            }(function (a, b, c) {
                return c.indexOf(a, b + 1) < 0
            });

            // Función que muestra un mensaje cuando no hay bancos con un tipo de credito
            function mensajeCredito(credito) {
                $('#target').unbind('mousemove');
                var mensaje = 'No existe bancos a ' + $scope.radio + ' km de su ubicación con el ' + credito + ".";
                alertaMensaje(mensaje, "Aceptar", "Mensaje");
                map.panTo(L.latLng(latitud, longitud));

                $("#target").mousemove(function (event) {
                    mensaje = "No existen bancos para realizar la Simulación.";
                    alertaBoton(mensaje);
                });
            }

            // Función que método para mostrar las alertas
            function alertaMensaje(mensaje, btnMensaje, cabecera) {
                $scope.alertPopup = $ionicPopup.alert({
                    title: cabecera,
                    template: mensaje,
                    okText: btnMensaje
                });

                $scope.alertPopup.then(function (res) {
                    $scope.popover.hide();
                });
            }

            // Función para mostrar los mensajes de cargando bancos
            function alertaCargando(mensaje) {
                $scope.loading = $ionicLoading.show({
                    content: 'gfg',
                    template: '<ion-spinner icon="bubbles"> </ion-spinner> </br>' + mensaje,
                    showBackdrop: true
                });
            }

            // Función para mostrar los mensajes de cargando bancos
            function alertaBoton(mensaje) {
                $ionicLoading.show({
                    template: mensaje,
                    duration: 2500
                });
            }

            // Función que verifica si esta activado al GPS
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
                    $scope.datos_creditos = [];
                    localizarUsuario();
                });
            }
        })


        //Almacena los bancos a 10 km con el mismo credito
        .factory('Bancos_cercanos', function () {
            return{
                data: {}
            };
        })



        // CONTROLADOR QUE MUESTRA LA LISTA DE LOS BANCOS

        .controller('listaCtrl', function ($scope, Bancos_cercanos, $ionicPopup, $ionicHistory, $http, $state, $ionicLoading) {

            // VARIABLES GLOBALES
            $scope.listaBancos = Bancos_cercanos.data.creditos_bancos_cercanos; // variable que almacena los bancos 

            // FUNCIONES

            if ($state.params.bandera == 2) {
                obtenerListaBancos();
            }

            /* Función que recibe el banco seleccionado por el usuario y lo almacena en una variable 
             * para posteriormente mostrarlo en el mapa 
             */
            $scope.mostrarBanco = function (banco) {
                Bancos_cercanos.estado = true;
                Bancos_cercanos.banco_ubicacion = banco;

            }

            // Función que obtiene la todos los bancos de bancos
            function obtenerListaBancos() {
                var mensaje = 'Cargando Bancos';
                alertaCargando(mensaje);
                $http.get('http://181.198.51.178:8083/WebserviceAri/public/banco/GetBancos').then(function (response) {

                    if (JSON.stringify(response.data.result).length == 2) {
                        $ionicLoading.hide();
                        var mensaje = 'Lo sentimos, no existen bancos registrados.';
                        alertaMensaje(mensaje, "Aceptar", "Mensaje");
                    } else {
                        $scope.bancos = response.data.result;
                        $ionicLoading.hide();
                    }

                }).catch(function (e) {
                    $ionicLoading.hide();
                    var mensaje = "Lo sentimos, actualmente existen problemas con el servidor. Intente más tarde";
                    alertaMensaje(mensaje, "Aceptar", "Mensaje");
                });

            }

            // Función que muestra el mensaje de cargando
            function alertaCargando(mensaje) {
                $scope.loading = $ionicLoading.show({
                    template: '<ion-spinner icon="bubbles"> </ion-spinner> </br>' + mensaje,
                    showBackdrop: true
                });
            }

            function alertaMensaje(mensaje, btnMensaje, cabecera) {
                $scope.alertPopup = $ionicPopup.alert({
                    title: cabecera,
                    template: mensaje,
                    okText: btnMensaje
                });
                $scope.alertPopup.then(function (res) {
                    $ionicHistory.goBack(-1);
                });
            }

            // Función para abrir y cerrar la lista de los bancos 
            $scope.toggleGroup = function (group) {
                if ($scope.isGroupShown(group)) {
                    $scope.shownGroup = null;
                } else {
                    $scope.shownGroup = group;
                }
            };
            $scope.isGroupShown = function (group) {
                return $scope.shownGroup === group;
            };
        })




        // CONTROLADOR EN DONDE SE REALIZA LA SIMULACION DEL CREDITOS       

        .controller('simuladorCreditoCtrl', function ($scope, $state, $http, $ionicHistory, $ionicLoading, $ionicPopup, Datos_formulario, Bancos_cercanos) {

            // VARIABLES GLOBALES

            $scope.tabla_SF = []; // Amacena el resultado de la simulacion sistema frances
            $scope.tabla_SA = []; // Amacena el resultado de la simulacion sistema alemán            
            $scope.datos_credito = {}; //  Almacena los datos del formulario

            // FUNCIONES

            // Determina que tipo de simulación es: por banco, credito, bancos más cercanos 
            switch ($state.params.bandera) {
                case "1": // Simulador por banco
                    // bandera para saber si la simulación es por banco o credito o por bancos cercanos
                    Bancos_cercanos.data.bandera_credito = 1;
                    obtenerCreditosPorBanco();
                    document.getElementById('encabezado1').style.display = 'block';
                    break;
                case "2": // Simulador por Crédito
                    Bancos_cercanos.data.bandera_credito = 2;
                    obtenerListaCreditos();
                    document.getElementById('encabezado2').style.display = 'block';
                    break;
                case "3": // Simulador por bancos cercanos (mapa)
                    Bancos_cercanos.data.bandera_credito = 3;
                    $scope.bancos_credito = Bancos_cercanos.data.creditos_bancos_cercanos; // Contiene los bancos con los datos de sus creditos
                    $scope.credito_seleccionado = Bancos_cercanos.data.credito_seleccionado; // Contiene el nombre credito seleccionado
                    validarCampos();
                    break;
            }


            // Función que obtiene la lista de creditos de un banco
            function obtenerCreditosPorBanco() {
                $scope.nombre_banco = $state.params.bancoNombre;
                var mensaje = 'Cargando Datos';
                alertaCargando(mensaje);
                // Obtiene la lista de creditos de un banco
                $http.get("http://181.198.51.178:8083/WebserviceAri/public/banco/GetCreditosPorBanco/" + parseInt($state.params.bancoId)).then(function (response) {
                    if (JSON.stringify(response.data.result).length == 2) {
                        $ionicLoading.hide();
                        mensaje = "Lo sentimos, no existen créditos ingresados en este banco" + ".";
                        alertaMensaje(mensaje, "Aceptar", "Mensaje", true);
                    } else {
                        $scope.creditos = response.data.result;
                        Bancos_cercanos.data.id_bancos = parseInt($state.params.bancoId);
                        $ionicLoading.hide();
                    }
                }).catch(function (e) {
                    $ionicLoading.hide();
                    var mensaje = "Lo sentimos, actualmente existen problemas con el servidor. Intente más tarde";
                    alertaMensaje(mensaje, "Aceptar", "Mensaje");
                });
            }

            // Función que obtiene la lista de creditos de todos los bancos
            function obtenerListaCreditos() {
                var mensaje = 'Obteniendo Datos';
                alertaCargando(mensaje);
                $http.get("http://181.198.51.178:8083/WebserviceAri/public/banco/GetListaCreditos").then(function (response) {
                    if (JSON.stringify(response.data.result).length == 2) {
                        $ionicLoading.hide();
                        var mensaje = 'Lo sentimos, no existen créditos registrados.';
                        alertaMensaje(mensaje, "Aceptar", "Mensaje");
                    } else {
                        $scope.creditos = response.data.result;
                        $ionicLoading.hide();
                    }

                }).catch(function (e) {
                    $ionicLoading.hide();
                    var mensaje = "Lo sentimos, actualmente existen problemas con el servidor. Intente más tarde";
                    alertaMensaje(mensaje, "Aceptar", "Mensaje");
                });
            }


            $scope.seleccionarCredito = function (credito) {
                $scope.bancos_credito = [];
                $scope.credito_seleccionado = credito.nombreCategoria;
                Bancos_cercanos.data.credito_seleccionado = credito.nombreCategoria;
                Bancos_cercanos.data.id_credito = credito.idCategoria;

                if ($state.params.bandera == 1) {
                    $scope.bancos_credito.push(credito);
                    $scope.monto_min = credito.montoMinimo;
                    $scope.monto_max = credito.montoMaximo;
                    $scope.plazo_min = credito.plazoMinimo;
                    $scope.plazo_max = credito.plazoMaximo;

                } else {
                    var mensaje = 'Obteniendo Datos';
                    alertaCargando(mensaje);
                    // Devuelve todos los bancos que tienen un tipo de credito
                    $http.get("http://181.198.51.178:8083/WebserviceAri/public/banco/GetBancosPorCredito/" + parseInt(credito.idCategoria)).then(function (creditos) {
                        if (JSON.stringify(creditos.data.result).length == 2) {
                            $ionicLoading.hide();
                            mensaje = "No existen bancos con el " + $scope.credito_seleccionado + ".";
                            alertaMensaje(mensaje, "Aceptar", "Mensaje", false);
                        } else {
                            $ionicLoading.hide();
                            $scope.bancos_credito = creditos.data.result;
                            validarCampos();
                        }
                    });
                }
            }

            // FUNCIONES DEL SIMULADOR

            //Funcion que realiza los calculos dependiendo del sistema de amortizacion
            function calcularCreditos(sistema, monto, plazo) {
                for (var i = 0; i < $scope.bancos_credito.length; i++) {
                    if ($scope.credito_seleccionado === $scope.bancos_credito[i].nombreCategoria) {
                        if (sistema === "SISTENA FRANCES O CUOTA FIJA") {
                            $scope.bancos_credito[i].Resultado = calcularSistemaFrances(monto, plazo, $scope.bancos_credito[i].tasaInteres);
                        } else {
                            $scope.bancos_credito[i].Resultado = calcularSistemaAleman(monto, plazo, $scope.bancos_credito[i].tasaInteres);
                        }
                    }
                }
                Bancos_cercanos.data.creditos_bancos_cercanos = $scope.bancos_credito;
                $scope.limpiar();
            }

            // Función que devuelve el resultado de los datos ingresados mediante el sistema frances
            function calcularSistemaFrances(monto, plazo, tasa_interes) {
                var tasa_interes_meses = tasa_interes / (12 * 100);
                var cuota = monto * (tasa_interes_meses / (1 - Math.pow((1 + tasa_interes_meses), -plazo)));
                var saldo_inicial = monto;
                var interes = saldo_inicial * tasa_interes_meses;
                var amortizacion = cuota - interes;
                var saldo_final = saldo_inicial - amortizacion;
                $scope.valor_Total = 0;
                $scope.tabla_SF = [];
                for (var i = 0; i <= plazo; i++) {
                    var resultado = {};
                    if (i === 0) {
                        resultado.i = i;
                        resultado.amortizacion = 0;
                        resultado.interes = 0;
                        resultado.cuota = 0;
                        resultado.saldofinal = saldo_inicial;
                    } else {
                        resultado.i = i;
                        resultado.amortizacion = amortizacion.toFixed(2);
                        resultado.interes = interes.toFixed(2);
                        resultado.cuota = cuota.toFixed(2);
                        resultado.saldofinal = Math.abs(saldo_final.toFixed(2));
                        saldo_inicial = saldo_final;
                        interes = saldo_inicial * tasa_interes_meses;
                        amortizacion = cuota - interes;
                        saldo_final = saldo_inicial - amortizacion;
                        $scope.valor_Total += cuota;
                    }

                    $scope.tabla_SF.push(resultado);
                }
                var data = {};
                data = {
                    tasa_credito: tasa_interes,
                    total_cuota: $scope.valor_Total.toFixed(2),
                    tabla_amortizacion: $scope.tabla_SF
                }
                return data;
            }

            // Función que devuelve el resultado de los datos ingresados mediante el sistema alemán
            function calcularSistemaAleman(monto, plazo, tasa_interes1) {
                var tasa_interes_meses = tasa_interes1 / (12 * 100);
                var amortizacion = monto / plazo;
                var saldo_inicial = 0;
                var tasa_interes = tasa_interes_meses;
                var interes = 0;
                var cuota = 0;
                var saldo_final = monto;
                $scope.valor_total = 0;
                $scope.tabla_SA = [];
                for (var i = 0; i <= plazo; i++) {
                    var resultado = {};
                    if (i === 0) {
                        resultado.i = i;
                        resultado.amortizacion = 0;
                        resultado.interes = 0;
                        resultado.cuota = 0;
                        resultado.saldofinal = monto;
                    } else {
                        saldo_inicial = saldo_final;
                        interes = saldo_final * tasa_interes_meses;
                        cuota = interes + amortizacion;
                        saldo_final = saldo_inicial - amortizacion;
                        resultado.i = i;
                        resultado.amortizacion = amortizacion.toFixed(2);
                        resultado.interes = interes.toFixed(2);
                        resultado.cuota = cuota.toFixed(2);
                        resultado.saldofinal = Math.abs(saldo_final.toFixed(2));
                        $scope.valor_total += cuota;
                    }
                    $scope.tabla_SA.push(resultado);
                }
                var data = {};
                data = {
                    tasa_credito: tasa_interes1,
                    total_cuota: $scope.valor_total.toFixed(2),
                    tabla_amortizacion: $scope.tabla_SA
                }
                return data;
            }

            // Funcion que obtiene el banco con el credito menor
            function mejorAlternativa() {
                $scope.mejor_credito = []; // mejor tasa de interes
                for (var i = 0; i < $scope.bancos_credito.length; i++) {
                    $scope.mejor_credito[i] = $scope.bancos_credito[i].tasaInteres;
                }
                $scope.mejor = Math.min.apply(null, $scope.mejor_credito);

                for (var i = 0; i < $scope.bancos_credito.length; i++) {
                    if ($scope.bancos_credito.length != 1) {
                        if ($scope.bancos_credito[i].tasaInteres == $scope.mejor) {
                            $scope.bancos_credito[i].opcion = 1; // Cuando las tasas de interes es igual a la menor
                        } else {
                            $scope.bancos_credito[i].opcion = 0; // Cuando las tasas de interes es diferente a la menor
                        }
                    } else {
                        $scope.bancos_credito[i].opcion = 2; // Cuando existe un solo banco para simular
                    }
                }
            }

            $scope.guardarDatos = function (datos) {
                mejorAlternativa();
                Datos_formulario.data.formulario = datos;
                calcularCreditos(datos.datos_sistemas, parseInt(datos.monto), parseInt(datos.plazo));
            };


            // VALIDACIONES DE LOS CAMPOS

            function validarCampos() {
                $scope.monto_min = valores_minimos(1);
                $scope.monto_max = valores_maximos(1);
                $scope.plazo_min = valores_minimos(2);
                $scope.plazo_max = valores_maximos(2);
            }

            function valores_minimos(n) {
                $scope.mejor_credito = []; // mejor tasa de interes
                for (var i = 0; i < $scope.bancos_credito.length; i++) {
                    if (n == 1) {
                        $scope.mejor_credito[i] = $scope.bancos_credito[i].montoMinimo;
                    } else {
                        $scope.mejor_credito[i] = $scope.bancos_credito[i].plazoMinimo;
                    }
                }
                $scope.mejor = Math.min.apply(null, $scope.mejor_credito);
                return $scope.mejor;
            }

            function valores_maximos(n) {
                $scope.mejor_credito = []; // mejor tasa de interes
                for (var i = 0; i < $scope.bancos_credito.length; i++) {
                    if (n == 1) {
                        $scope.mejor_credito[i] = $scope.bancos_credito[i].montoMaximo;
                    } else {
                        $scope.mejor_credito[i] = $scope.bancos_credito[i].plazoMaximo;
                    }
                }
                $scope.mejor = Math.max.apply(null, $scope.mejor_credito);
                return $scope.mejor;
            }

            // Limpia el formulario
            $scope.form = {};
            $scope.limpiar = function () {
                $scope.datos_credito = {};
                $scope.form.simulador.$setUntouched();
                $scope.form.simulador.$setPristine();
            }

            function alertaCargando(mensaje) {
                $scope.loading = $ionicLoading.show({
                    content: 'gfg',
                    template: '<ion-spinner icon="bubbles"> </ion-spinner> </br>' + mensaje,
                    showBackdrop: true
                });
            }

            function alertaMensaje(mensaje, btnMensaje, cabecera, bandera) {

                $scope.alertPopup = $ionicPopup.alert({
                    title: cabecera,
                    template: mensaje,
                    okText: btnMensaje
                });
                $scope.alertPopup.then(function (res) {
                    if (bandera) {
                        $ionicHistory.goBack(-1);
                    } else {
                        $scope.limpiar();
                    }
                });
            }

        })

        .factory('Datos_formulario', function () {
            return{
                data: {}
            };
        })






        // CONTROLADOR QUE MUESTRA EL RESULTADO DE LA SIMULACION
        .controller('resultadoCtrl', function ($scope, $http,Datos_formulario, Bancos_cercanos, $ionicHistory) {

            // VARIABLES GLOBALES
            $scope.bancos = Bancos_cercanos.data.bancos; // bancos cercanos a 10 km que tienen el credito
            $scope.resultado_simulacion = Bancos_cercanos.data.creditos_bancos_cercanos; // creditos
            $scope.datos_Ingresados = Datos_formulario.data.formulario; // Datos del obtenidos del formulario
            $scope.credito_seleccionado = Bancos_cercanos.data.credito_seleccionado; // Credito seleccionado por el  usuario
            $scope.id_bancos_mejor = []; // obtener los id de los bancos con mejor opcion
            $scope.bancos_mejor = []; // contiene la informacion bancos que tienen la mejor opcion
            $scope.id_credito = Bancos_cercanos.data.id_credito;
           
            // FUNCIONES

            switch (Bancos_cercanos.data.bandera_credito) {
                case 1: // Simulador por banco
                    document.getElementById('resultado1').style.display = 'block';
                    document.getElementById('mapa1').style.display = 'block';
                    Bancos_cercanos.data.tasa_interes = $scope.resultado_simulacion[0].Resultado.tasa_credito;

                    break;
                case 2: // Simulador por Crédito
                    document.getElementById('resultado2').style.display = 'block'; // todos los bancos
                    listaBancosMejorCredito(2);

                    break;
                case 3: // Simulador por bancos cercanos (mapa)
                    document.getElementById('resultado2').style.display = 'block';
                    listaBancosMejorCredito(1);
                    break;
            }

            // Función que obtiene los bancos con mejor alternativa de crédito
            function listaBancosMejorCredito(bandera) {
                $scope.id_bancos_mejor = []; // obtener los id de los bancos con mejor opcion
                $scope.bancos_mejor = []; // contiene la informacion bancos que tienen la mejor opcion
                var tasa_interes;
                var c = 0;
                for (var i = 0; i < $scope.resultado_simulacion.length; i++) {
                    if (($scope.resultado_simulacion[i].opcion == 1) || ($scope.resultado_simulacion[i].opcion == 2)) {
                        $scope.id_bancos_mejor.push($scope.resultado_simulacion[i].idEmpresa); // bancos con mejor opcion
                        var tasa_interes = $scope.resultado_simulacion[i].Resultado.tasa_credito;
                    } else {
                        c++;
                    }
                }

                if (($scope.id_bancos_mejor.length >= 1) && (c >= 1)) {
                    document.getElementById('nota').style.display = 'block';
                } else {
                    document.getElementById('mapa').style.display = 'block'
                }

                if (bandera == 1) {
                    // obtiene la ubicacion de los bancos con mejor anternativa
                    for (var i = 0; i < $scope.id_bancos_mejor.length; i++) {
                        for (var j = 0; j < $scope.bancos.length; j++) {
                            if ($scope.id_bancos_mejor[i] == $scope.bancos[j].idEmpresa) {
                                $scope.bancos_mejor.push($scope.bancos[j]);
                            }
                        }
                    }
                } else {
                    Bancos_cercanos.data.tasa_interes = tasa_interes;
                    Bancos_cercanos.data.id_bancos = $scope.id_bancos_mejor;

                }
            }

            // Esta función envia los datos al controlador MapaRutaController 
            $scope.verMapa = function () {
                var bandera = Bancos_cercanos.data.bandera_credito;
                if (bandera == 3) {
                    Bancos_cercanos.data.lista_bancos = $scope.bancos_mejor;
                    Bancos_cercanos.data.id_bancos = $scope.id_bancos_mejor;

                }
            };

            // Esta función almacena la tabla de amortizacion de acuerdo a un tipo de banco.
            $scope.mostrarDatosTabla = function (banco) {
                Bancos_cercanos.data.tabla = banco.Resultado.tabla_amortizacion;
            };

            // Función que regresa al inicio de la aplicación
            $scope.ventanaInicio = function () {
                if (Bancos_cercanos.data.bandera_credito == 3) {
                    $ionicHistory.goBack(-2);
                } else {
                    $ionicHistory.goBack(-3);
                }
            }

            

        })



        // CONTROLADOR QUE MUESTRA LOS BANCOS EN EL MAPA CON MEJOR ALTERNATIVA DE CREDITO
        .controller('mapaMejorAlternativaCtrl', function ($scope, $ionicLoading, $http, $ionicPopup, Bancos_cercanos) {

            // VARIABLES GLOBALES
            $scope.id_bancos_mejor = Bancos_cercanos.data.id_bancos; // almacena los ids de los bancos con mejor credito                                      
            $scope.tasa_interes = Bancos_cercanos.data.tasa_interes;
            $scope.id_credito = Bancos_cercanos.data.id_credito;           
            var latitud = 0;
            var longitud = 0;
            var datosTemporalesHorarios = []; //Arreglo para guardas los datos temporales de los horarios
            var marcadores = new Array();
            var datosMarcador = new Array();
            var map = null;
            var osmUrl = "";
            var popupBanco;

            // FUNCIONES


            // Función que se ejecuta cuando la aplicacion ha iniciado y cargar el mapa
            $scope.mapa = function () {
                obtenerBancos();
                $('#map2').css('height', '100%');
            };

    
            // Función que obtiene las sucursales de un determinado banco para mostrarlas en el mapa
            function obtenerBancos() {
                switch (Bancos_cercanos.data.bandera_credito) {
                    case 1: // Simulador por banco
                        var mensaje = 'Cargando banco(os) ';
                        alertaCargando(mensaje);
                        $http.get('http://181.198.51.178:8083/WebserviceAri/public/banco/GetBancosMejorAltenativa/' + parseInt($scope.id_credito) + '/' + $scope.tasa_interes).then(function (response) {
                            $scope.bancos_mejores = response.data.result;
                            $http.get('http://181.198.51.178:8083/WebserviceAri/public/banco/GetTodosHorarios').then(function (response) {
                                datosTemporalesHorarios = response.data.result;
                                localizarUsuario();
                            })
                        }).catch(function (e) {
                            $ionicLoading.hide();
                            var mensaje = "Lo sentimos, actualmente existen problemas con el servidor. Intente más tarde";
                            alertaMensaje(mensaje, "Aceptar", "Mensaje");
                        });


                        break;
                    case 2: // Simulador por Crédito
                        var mensaje = 'Cargando banco(os) con mejor crédito';
                        alertaCargando(mensaje);

                        $http.get('http://181.198.51.178:8083/WebserviceAri/public/banco/GetBancosMejorAltenativa/' + parseInt($scope.id_credito) + '/' + $scope.tasa_interes).then(function (response) {
                            $scope.bancos_mejores = response.data.result;
                            $http.get('http://181.198.51.178:8083/WebserviceAri/public/banco/GetTodosHorarios').then(function (response) {
                                datosTemporalesHorarios = response.data.result;
                                localizarUsuario();
                            })
                        }).catch(function (e) {
                            $ionicLoading.hide();
                            var mensaje = "Lo sentimos, actualmente existen problemas con el servidor. Intente más tarde";
                            alertaMensaje(mensaje, "Aceptar", "Mensaje");
                        });

                        break;
                    case 3: // Simulador por bancos cercanos (mapa)
                        var mensaje = 'Cargando banco(os) con mejor crédito';
                        alertaCargando(mensaje);
                        $scope.bancos_mejores = Bancos_cercanos.data.lista_bancos; // Almacena los bancos con mejor crédito
                        datosTemporalesHorarios = Bancos_cercanos.data.horarios;
                        localizarUsuario();
                        break;
                }
            }


            function cargaUsuario() {
                var myIcon = L.icon({
                    iconUrl: 'img/usuario.png',
                    iconAnchor: [22, 94],
                    popupAnchor: [-3, -96],
                });
                var market = L.marker([latitud, longitud], {icon: myIcon}).addTo(map);
            }


            //Funcion que obtiene la ubicacion del usuario y dibija el marcador en el mapa
            function localizarUsuario() {
                //if ($cordovaNetwork.isOnline() === true) {                             
                navigator.geolocation.getCurrentPosition(function (position) {
                    latitud = position.coords.latitude;
                    longitud = position.coords.longitude;
                    osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                            osm = L.tileLayer(osmUrl, {maxZoom: 18, attribution: osmAttrib});
                    if (map === null) {
                        map = L.map('map2').setView([latitud, longitud], 17).addLayer(osm);
                    }


                    cargaUsuario();

                    //Carga los marcadores en el mapa recibe la posicion del usuario
                    cargarMarcadores();
                }, function (error) {
                    $ionicLoading.hide();
                    //activarGPS();  si estaba habilitado
                    //alert(error);
                }, {maximumAge: 3000, timeout: 5000, enableHighAccuracy: true});
//                } else {
//                    mensaje = "Verifique que esté conectado a una red Wifi o sus datos móviles estén acivos, intente nuevamente más tarde.";
//                    alertaMensaje(mensaje, "Aceptar", "Compruebe su Conexión");
//                    $ionicLoading.hide();
//                }
            }

          

            function cargarMarcadores() {
                marcadores[0] = L.latLng(latitud, longitud);

                for (var i = 0; i < $scope.bancos_mejores.length; i++) {
                    var customOptions = {
                        'maxWidth': '500',
                        'className': 'custom'
                    };
                    
                     if ($scope.bancos_mejores[i].idEmpresa == $scope.id_bancos_mejor[0]) {
                        var myIcon = cambiarIcono('img/banco_op1.png');

                    } else if ($scope.bancos_mejores[i].idEmpresa == $scope.id_bancos_mejor[1]) {
                        var myIcon = cambiarIcono('img/banco_op2.png');

                    } else if ($scope.bancos_mejores[i].idEmpresa == $scope.id_bancos_mejor[2]) {
                        var myIcon = cambiarIcono('img/banco_op3.png');
                    } else {
                        var myIcon = cambiarIcono('img/banco_op1.png');
                    }

                    marcadores[i + 1] = L.latLng(parseFloat($scope.bancos_mejores[i].latitud), parseFloat($scope.bancos_mejores[i].longitud));
                    popupBanco = L.popup()
                            .setLatLng(L.latLng(parseFloat($scope.bancos_mejores[i].latitud), parseFloat($scope.bancos_mejores[i].longitud)))
                            .setContent(informacionBanco($scope.bancos_mejores[i]));

                    var market = L.marker([parseFloat($scope.bancos_mejores[i].latitud), parseFloat($scope.bancos_mejores[i].longitud)], {icon: myIcon}).addTo(map).bindPopup(popupBanco, customOptions).on("popupopen", informacionVentana);
                    datosMarcador[i] = market;
                }
                map.fitBounds(marcadores);
                $ionicLoading.hide();
            }


            function informacionBanco(banco) {
                return '<div>' +
                        '<div class="iw-title">' +
                        "<label id='nombre' style='font-size: 12px;'>"
                        + banco.nombreSucursal + "</label>" +
                        "<label id='direccion' class='item item-icon-left'  style='display: none;background:none;'> "
                        + banco.direccion + "</label>" +
                        "<label id='telefono' class='item item-icon-left'  style='display: none;background:none;'>"
                        + banco.telefono + "</label>" +
                        "<label id='distancia' class='item item-icon-left'  style='display: none;background:none;'>"
                        + (parseFloat(banco.distance).toFixed(2)) + "</label>" + '</div>' +
                        '</div>' +
                        "<div id='origen' style='display: none;'>" + banco.latitud + "=" + banco.longitud + "===" + banco.latitud + ',' + banco.longitud + "</div>";
            }

            function cambiarIcono(imagen){
                return L.icon({
                        iconUrl:imagen,
                        iconAnchor: [22, 94],
                        popupAnchor: [-3, -96],
                    });
            }

            function informacionVentana() {                
                $("#nombre:visible").click(function (event) {                    
                    event.preventDefault();
                   var datosHorario = "</div>";
                    var contador = 0;
                    for (var i = 0; i < datosTemporalesHorarios.length; i++) {
                        var datos = datosTemporalesHorarios[i];
                        if (datos.nombreSucursal === $('#nombre').text()) {
                            datosHorario += datos.descripcion + ": " + datos.horaInicioHorario.split(":")[0] + ":" + datos.horaInicioHorario.split(":")[1] + " a " + datos.horaFinHorario.split(":")[0] + ":" + datos.horaFinHorario.split(":")[1] + "<br/>";
                            contador++;
                        }
                    }
                    if (contador === 0) {
                        datosHorario = "<center><b>Sin asiganar</b></center>"
                    }                  
                    
                    if (Bancos_cercanos.data.bandera_credito == 3) {
                        var mensaje = "<div id='contenido-info' style='margin-top: 4%;'>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-location' style='font-size:20px; color: red'></i> " + $('#direccion').text() + "</div>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-ios-telephone' style='font-size:20px; color: red'></i>  " + $('#telefono').text() + "</div>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-map' style=' font-size:20px; color: red'></i>  " + $('#distancia').text() + " km Aproximadamente. </div>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-clock' style='font-size:20px; color: red'></i> Horarios:" + datosHorario + "</div>"
                            + "</div> ";
                    } else {
                        var mensaje = "<div id='contenido-info' style='margin-top: 4%;'>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-location' style='font-size:20px; color: red'></i> " + $('#direccion').text() + "</div>" +
                            "<div style='padding-bottom:15px;'><i class='icon ion-ios-telephone' style='font-size:20px; color: red'></i>  " + $('#telefono').text() + "</div>" +                            
                            "<div style='padding-bottom:15px;'><i class='icon ion-clock' style='font-size:20px; color: red'></i> Horarios:" + datosHorario + "</div>"
                            + "</div> ";
                    }

                    ventanaFlotanteInformacion(mensaje, $('#nombre').text(), $('#origen').text());
                });
            }


            //Función para obtener la informacion de la farmacia

            // Muestra la ventana flotante con la informacición del banco y la opción ver ruta
            // Recibe los paramentros(idBanco: contiene el id del banco, mensaje: contiene la información de banco, cabecera: nombre del banco 
            // y finalmente la latitud y longitud del banco)           
            function ventanaFlotanteInformacion(mensaje, cabecera, coordenadas) {
                var confirmPopup = $ionicPopup.confirm({
                    title: cabecera,
                    template: mensaje,
                    cancelText: '¿Cómo llegar?',
                    okText: 'Aceptar'

                });
                confirmPopup.then(function (res) {
                    if (!res) {
                        datosNavigator = coordenadas.split("===")[1];
                        $scope.abrirNavigator();
                    }
                });
                for (var i = 0; i < datosMarcador.length; i++) {
                    datosMarcador[i].closePopup();
                }
            }

            // Función que método para mostrar las alertas
            function alertaMensaje(mensaje, btnMensaje, cabecera) {
                $scope.alertPopup = $ionicPopup.alert({
                    title: cabecera,
                    template: mensaje,
                    okText: btnMensaje
                });
            }

            $scope.abrirNavigator = function () {
                //q: establece el punto de llegada para búsquedas de navegación.
                window.open("http://maps.google.com/maps?saddr=" + latitud + "," + longitud + "&daddr=" + datosNavigator, '_system');

                //window.open('geo:0,0?q=' + datosNavigator+"(Direccion)", '_system');
            };

            // Función que centra el mapa en la ubicación del usuario
            $scope.ubicar = function () {
                //map.panTo(L.latLng(latitud, longitud));
                map.setView(new L.LatLng(latitud, longitud), 14);
            };


            // Función que verifica si esta activado al GPS
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
                });
            }

            // Función que muestra el mensaje de cargando
            function alertaCargando(mensaje) {
                $scope.loading = $ionicLoading.show({
                    template: '<ion-spinner icon="bubbles"> </ion-spinner> </br>' + mensaje,
                    showBackdrop: true
                });
            }

        })



        // CONTROLADOR QUE MUESTRA LA TABLA DE PAGOS
        .controller('tablaCtrl', function ($scope, Bancos_cercanos) {
            $scope.tabla = Bancos_cercanos.data.tabla;
        })


