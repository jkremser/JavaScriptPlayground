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
    $scope.rhqHostname = 'localhost';
    //$http.defaults.headers.common.Authentication = 'Basic cmhxYWRtaW46cmhxYWRtaW4=';
    $http({ method: 'GET', url: 'http://127.0.0.1:7080/rest/metric/data/10012/raw.json' }).
      success(function (data, status, headers, config) {
        $scope.metrics = data.map(function(foo){ return [new Date(foo.timeStamp), foo.value]; });
        $scope.foograph = [[new Date(1394563626277),4309663744], [new Date(1394563626277),4309684224], [new Date(1394569295152),20], [new Date(1394571695149),50], [new Date(1394572554062),70]];
      }).
      error(function (data, status, headers, config) {
        console.log('Error - status: ' + status + ', headers: ' + headers + ', config: ' + config + ', data: ' + data);
      });
  })

  .directive('graph', function ($parse, $q) {
    return {
      restrict: 'A',
      replace: true,
      scope: {data: '=', opts: '=', options: '='},
      link: function (scope, element, attrs) {
        var dataArrived = $q.defer();
        dataArrived.promise.then(function (graphData) {
          scope.graph = new Dygraph(element[0], graphData, scope.opts);
          return graphData.length - 1;
        }).then(function(lastPoint) {
          scope.graph.setSelection(lastPoint);
          scope.$emit('dygraphCreated', element[0].id, scope.graph);
        });
        var removeInitialDataWatch = scope.$watch('data', function (newValue, oldValue, scope) {
          if ((newValue !== oldValue) && (newValue.length > 0)) {
            dataArrived.resolve(newValue);
            removeInitialDataWatch();
            scope.$watch('data', function (newValue, oldValue, scope) {
              if ((newValue !== oldValue) && (newValue.length > 0)) {
                var selection = scope.graph.getSelection();
                scope.graph.updateOptions({'file': newValue});
                if ((selection >= 0) && (selection < newValue.length)) {
                  scope.graph.setSelection(selection);
                }
              }
            }, true);
            scope.$watch('options', function (newValue, oldValue, scope) {
              if (newValue !== undefined) {
                scope.graph.updateOptions(newValue);
              }
            }, true);
          }
        }, true);
      }
    };
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

