var InventoryRest = ( function(window, undefined) {
	'use strict';

	var base = 'http://localhost:8080/hawkular/inventory/';
	var user = 'jdoe';
	var password = 'password';

	function getTenant(callback) {
		$.ajax({
			url: base + 'tenant',
			headers: {
				'Authorization': 'Basic ' + btoa(user + ':' + password)
			},
		}).then(function(data) {
			callback(data);
		});
	}

	function getRelationships(path, callback) {
		$.ajax({
			url: base + path + '/relationships',
			headers: {
				'Authorization': 'Basic ' + btoa(user + ':' + password)
			},
		}).then(function(data) {
			callback(data);
		});
	}

	function getNodeByPath(path, callback) {
		$.ajax({
			url: base + 'path' + path,
			headers: {
				'Authorization': 'Basic ' + btoa(user + ':' + password)
			},
		}).then(function(data) {
			callback(data);
		});
	}


	return {
		getTenant : getTenant,
		getRelationships : getRelationships,
		getNodeByPath: getNodeByPath
	};


}).call(window);