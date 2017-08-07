angular.module('starter.controllers', ['ngCordova'])

.controller('CrtlMed', ['$scope','$http','$state', function($scope,$http,$state){
  $scope.buscar = function  () {

      $http.get("http://farmacias.cis.unl.edu.ec/medicamento/GetBuscarMedCom/"+$scope.search).success(function(data){
         if (data.length > 0) {
          $scope.medicamentos = data;
         };
      });

  }

}])

.controller('CtrlDetalle', ['$scope','$http','$state', function($scope,$http,$state){

  $http.get('http://farmacias.cis.unl.edu.ec/medicamento/GetDetalleMed/'+$state.params.idmed+'/'+$state.params.idpres).success(function(data){
          $scope.datos = data[0];
          
  });

}])

.controller('CtrlMapa', ['$scope', '$http', '$state', '$cordovaGeolocation', function($scope, $http, $state, $cordovaGeolocation) {
  var posOptions = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        };
    
        $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
            var lat  = position.coords.latitude;
            var long = position.coords.longitude;

            var myLatlng = new google.maps.LatLng(lat, long);

            var mapOptions = {
                center: myLatlng,
                zoom: 16,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            map = new google.maps.Map(document.getElementById("map"), mapOptions);

            $scope.map = map;
            
            var marker = new google.maps.Marker({
            position: myLatlng,
            map: $scope.map,
            icon: 'img/usuario.png',

            });
            
            leerMarket(myLatlng);
        }, function(err) {
            
            console.log(err);
        });
    
       function leerMarket(posicionuser){
           $http.get("http://181.198.51.178:8083/php/get_all_busqueda_medicamentos_farmacia.php?nombre=AMEVAN").success(function(data){
           for(var i=0;i<data.FARMACIA.length; i++){
                var posfarmacia = new google.maps.LatLng(data.FARMACIA[i].LATITUD, data.FARMACIA[i].LONGITUD);
                
                   var marker = new google.maps.Marker({
                      position: posfarmacia,
                      map: $scope.map,
                      icon: 'img/market-farm.png',
                      title: data.FARMACIA[i].NOMBRE


                    });
               var info = data.FARMACIA[i].NOMBRE;
               agregarinfo(marker,info,posicionuser);
           }
           
      });
    }
    
    function agregarinfo(marker, mensaje, posicionuser){
        var infoWindow = new google.maps.InfoWindow({
          content: mensaje
      });
 
      google.maps.event.addListener(marker, 'click', function () {
          infoWindow.open($scope.map, marker);
          
           var mDirectionsRendererOptions = {
            map: $scope.map,
            suppressMarkers: true,
            suppressInfoWindows: true
            
            };
          var directionsService = new google.maps.DirectionsService;
          var directionsDisplay = new google.maps.DirectionsRenderer(mDirectionsRendererOptions);

          directionsDisplay.setMap($scope.map);

          directionsService.route({
            origin: posicionuser,
            destination: this.position,
            travelMode: google.maps.TravelMode.DRIVING
          }, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(response);
            } else {
              window.alert('Directions request failed due to ' + status);
            }
          });
      });
    }
}])

.controller('CtrlListFarm', ['$scope', '$http', '$state', '$cordovaGeolocation', function($scope, $http, $state, $cordovaGeolocation) {
  /*var posOptions = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        };
    
        $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
            var lat  = position.coords.latitude;
            var long = position.coords.longitude;

            $http.get('http://farmacias.cis.unl.edu.ec/medicamento/GetDetalleMed/'+$state.params.idmed+'/'+$state.params.idpres).success(function(data){
          $scope.datos = data[0];
          
           });

            
        }, function(err) {
            
            console.log(err);
        });*/
    $scope.id = $state.params.idmed;
       
    
}])




//SELECT companies.idEmpresa, companies.nombreEmpresa, companies.idGrupo, branches.idSucursal, branches.nombreSucursal, branches.direccion, branches.latitud, branches.longitud, (6371 * ACOS(COS(RADIANS(-4.031313))*COS(RADIANS(branches.latitud))*COS(RADIANS(branches.longitud)-RADIANS(-79.199305))+SIN(RADIANS(-4.031313))*SIN(RADIANS(branches.latitud)))) AS distance FROM companies,branches WHERE companies.idEmpresa = branches.idEmpresa AND companies.idGrupo = 3 HAVING distance<10 ORDER BY distance ASC 