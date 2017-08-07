angular.module('starter.controllersmedicamentos', ['ngCordova'])

.controller('CrtlMedCom', ['$scope','$http','$state','$cordovaNetwork','$cordovaDialogs','$ionicLoading','$cordovaBarcodeScanner', function($scope,$http,$state,$cordovaNetwork,$cordovaDialogs,$ionicLoading,$cordovaBarcodeScanner){
  $scope.buscar = function  () {
    $ionicLoading.show();
      if ($cordovaNetwork.isOnline() === true) {
        $http.get("http://farmacias.cis.unl.edu.ec/medicamento/GetBuscarMedCom/"+$scope.search).success(function(data){
         if (data.length > 0) {
          
          $scope.medicamentos = data;
          $ionicLoading.hide();
         }else{
          $cordovaDialogs.alert('No se ah encontrado ningún medicamento con las iniciales ingresadas. Por favor vuelva a intentar mas tarde.', 'Aviso', 'Aceptar');
          $ionicLoading.hide();
         };
      });
      }else{
          $cordovaDialogs.alert('Usted no esta conectado a internet. Por favor vuelva a intentar mas tarde.', 'Aviso', 'Aceptar');
      $ionicLoading.hide();
      };

  }

  $scope.barcode = function () {
    $cordovaBarcodeScanner
      .scan()
      .then(function(barcodeData) {
        
        alert(barcodeData.text);
      }, function(error) {
        
      });
  }

}])

.controller('CrtlMedGen', ['$scope','$http','$state','$cordovaNetwork','$cordovaDialogs','$ionicLoading','$cordovaBarcodeScanner', function($scope,$http,$state,$cordovaNetwork,$cordovaDialogs,$ionicLoading,$cordovaBarcodeScanner){
  $scope.buscar = function  () {
      $ionicLoading.show();
      if (($cordovaNetwork.isOnline() === true)&&($scope.search.length > 0)) {
        $http.get("http://farmacias.cis.unl.edu.ec/medicamento/GetBuscarMedGen/"+$scope.search).success(function(data){
         if (data.length > 0) {
          $scope.medicamentos = data;
          $ionicLoading.hide();
         }else{
          $cordovaDialogs.alert('No se ah encontrado ningún medicamento con las iniciales ingresadas. Por favor vuelva a intentar mas tarde.', 'Aviso', 'Aceptar');
         $ionicLoading.hide();
         };
      });
      }else{
          $cordovaDialogs.alert('Usted no esta conectado a internet. Por favor vuelva a intentar mas tarde.', 'Aviso', 'Aceptar');
      $ionicLoading.hide();
      };

  }

  $scope.barcode = function () {
    $cordovaBarcodeScanner
      .scan()
      .then(function(barcodeData) {
        
        alert(barcodeData.text);
      }, function(error) {
        
      });
  }

}])

.controller('CtrlDetalle', ['$scope','$http','$state', '$cordovaNetwork','$cordovaDialogs', function($scope,$http,$state,$cordovaNetwork,$cordovaDialogs){

    if ($cordovaNetwork.isOnline() === true) {
       $http.get('http://farmacias.cis.unl.edu.ec/medicamento/GetDetalleMed/'+$state.params.idmed+'/'+$state.params.idpres).success(function(data){
          $scope.datos = data[0];
          
      });
    }else{
          $cordovaDialogs.alert('Usted no esta conectado a internet. Por favor vuelva a intentar mas tarde.', 'Aviso', 'Aceptar');
    };

 }])

.controller('CtrlMapa', ['$scope', '$http', '$state', '$cordovaGeolocation','$cordovaDialogs','$ionicLoading','ServiceMedicamentos', function($scope, $http, $state, $cordovaGeolocation, $cordovaDialogs, $ionicLoading, ServiceMedicamentos) {
  var posOptions = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        };

        $ionicLoading.show();
            
        $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
            var lat  = position.coords.latitude;
            var long = position.coords.longitude;

            var myLatlng = new google.maps.LatLng(lat, long);

            var mapOptions = {
                center: myLatlng,
                zoom: 16,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

            var marker = new google.maps.Marker({
            position: myLatlng,
            map: $scope.map,
            icon: 'img/male-2.png',

            });
            
           var allfarmacias = ServiceMedicamentos.getall();
           var farm = ServiceMedicamentos.get($state.params.id);
           var posfarm = new google.maps.LatLng(farm.latitud, farm.longitud);

           var mDirectionsRendererOptions = {
            map: $scope.map,
            suppressMarkers: true,
            suppressInfoWindows: true
            
            };
          var directionsService = new google.maps.DirectionsService;
          var directionsDisplay = new google.maps.DirectionsRenderer(mDirectionsRendererOptions);

           leerMarket(allfarmacias, myLatlng, farm.idSucursal, directionsService, directionsDisplay);          
           trazarruta(myLatlng,posfarm,directionsService,directionsDisplay); 
           $ionicLoading.hide();         

        }, function(err) {
            
            console.log(err);
        })

     function leerMarket(data, posuser, idselec, directionsService, directionsDisplay){
           for(var i=0;i<data.length; i++){
                var posfarmacia = new google.maps.LatLng(data[i].latitud, data[i].longitud);
                
                   var marker = new google.maps.Marker({
                      position: posfarmacia,
                      map: $scope.map,
                      icon: 'img/market-farm.png',
                      title: data[i].nombreSucursal,


                    });
               var info = '<div id="iw-container">' +
                        '<div class="iw-title">' +
                        "<label id='nombreFar' style='background:none; color:white;font-size: 12px; font-weight: bold; font-family: 'Times New Roman', Times, serif;'>"
                        + data[i].nombreSucursal + "</label>" +
                        "<label id='direccion'   style='display: none;background:none;'> "
                        + data[i].direccion + "</label>" +
                        "<label id='telefono'   style='display: none;background:none;'>"
                        + data[i].telefono + "</label>"+'<div id="iw-container">' +
                        '<div class="iw-title">'; 
               
               var estado = 0;
               if (Number(idselec)===Number(data[i].idSucursal)) {
                estado = 1;
               };
               agregarinfo(marker,info,posuser,estado, directionsService, directionsDisplay);
           }
           
      
    }

    function trazarruta(origen, destino,directionsService, directionsDisplay) {
      directionsDisplay.setMap($scope.map);
            directionsService.route({
            origin: origen,
            destination: destino,
            travelMode: google.maps.TravelMode.DRIVING
          }, function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
              directionsDisplay.setDirections(response);
            } else {
              window.alert('Directions request failed due to ' + status);
            }
          });
    }
    
    function agregarinfo(marker, mensaje, posuser, estado, directionsService, directionsDisplay){
        var infoWindow = new google.maps.InfoWindow({
          content: mensaje
      });

        if (Number(estado)===1) {
          infoWindow.open($scope.map, marker);
        };
 
      google.maps.event.addListener(marker, 'click', function () {
          infoWindow.open($scope.map, marker);
          trazarruta(posuser, this.position, directionsService, directionsDisplay);
          
      });
    }
    
}])

.controller('CtrlListFarm', ['$scope', '$http', '$state', '$cordovaGeolocation','$cordovaNetwork','$cordovaDialogs','$location','$ionicLoading','ServiceMedicamentos', function($scope, $http, $state, $cordovaGeolocation, $cordovaNetwork,$cordovaDialogs,$location,$ionicLoading,ServiceMedicamentos) {
  var posOptions = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        };

        

        $scope.distancia = 10;
        $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
            var lat  = position.coords.latitude;
            var long = position.coords.longitude;

             if (($cordovaNetwork.isOnline() === true)&&(lat != 0)&&(long != 0)) {
              $http.get('http://farmacias.cis.unl.edu.ec/Farmacia/getAll/'+$state.params.idmed+'/'+lat+'/'+long+'/10').success(function(data){
                    $ionicLoading.show();
                    if (data.length > 0) {
                      $scope.datos = data;
                      $ionicLoading.hide();
                      ServiceMedicamentos.setfarmacias(data);
                    }else{
                      $cordovaDialogs.alert('No se ah encontrado ninguna farmacia que tenga en stock el medicamento solicitado que se encuetre cerca a usted.', 'Aviso', 'Aceptar');
                      $ionicLoading.hide();
                      //$location.url("/app/medicamentoscomerciales");
           };
                    
            });
             }else{
              $cordovaDialogs.alert('Usted no esta conectado a internet o su GPS no esta encendido.', 'Aviso', 'Aceptar');
              $ionicLoading.hide();
             };
        }, function(err) {
            
            console.log(err);
        });

$scope.cambiardistancia = function (distancia) {
  $ionicLoading.show();
  $scope.distancia = distancia;
  var data = ServiceMedicamentos.getxdistancia(distancia);
  $scope.datos = data;
  $ionicLoading.hide();
  /*if (data.length > 0) {
    $scope.datos = data;
    $ionicLoading.hide();
  }else{
    $cordovaDialogs.alert('No se han encontrado farmacias a '+distancia+' km. de su posición.', 'Aviso', 'Aceptar');
    $scope.datos = data;
    $ionicLoading.hide();
  };*/

}
    
       
    
}])

