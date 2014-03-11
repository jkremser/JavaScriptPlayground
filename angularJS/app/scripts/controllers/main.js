'use strict';

angular.module('anotherApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma',
      'Scala',
      'Java 8',
      'foobar'
    ];
    //$http.defaults.headers.common.Authentication = 'Basic cmhxYWRtaW46cmhxYWRtaW4=';
    $http({ method: 'GET', url: 'http://localhost:7080/rest/metric/data/10012/raw.json' }).
      success(function (data, status, headers, config) {
        console.log('status: ' + status + ', headers: ' + headers + ', config: ' + config + ', data: ' + data);
        $scope.metrics = data;
      }).
      error(function (data, status, headers, config) {
        console.log('Error - status: ' + status + ', headers: ' + headers + ', config: ' + config + ', data: ' + data);
      });
  })

  .factory('restHook', function($rootScope, $window) {
      return {
        request: function(config) {
          config.headers['Access-Control-Allow-Origin'] = '*';
          config.headers['Access-Control-Allow-Headers'] = 'Access-Control-Allow-Methods, Authorization';
          config.headers.Accept = 'application/json';
          config.headers.Authorization = 'Basic ' +  $window.btoa('rhqadmin' + ':' + 'rhqadmin');
          return config;
        }
      };
    })

  .config(function($httpProvider) {
      $httpProvider.interceptors.unshift('restHook');
    });

