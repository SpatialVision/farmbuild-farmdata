/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria

 * @author State of Victoria
 * @version 1.0.0
 */

'use strict';

/**
 * farmdataPaddocks class
 * @private-module farmdata/farmdataPaddocks
 */

/**
 * farmdata class
 * @module farmdata/paddocks
 */
angular.module('farmbuild.farmdata')
	.factory('farmdataPaddocks',
	function ($log,
	          collections,
	          validations,
	          farmdataPaddockValidator,
	          farmdataPaddockGroups,
	          farmdataConverter) {
		var farmdataPaddocks =
			{},
			_isDefined = validations.isDefined;

		function randomInt(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}

		function createName() {
			return 'Paddock ' + (new Date()).getTime() + randomInt(1, 1000);
		}

		function generateId() {
			return uuid.v4();
		}

		function createPaddockFeature(geoJsonGeometry) {
			return farmdataConverter.createFeature(geoJsonGeometry, createName());
		}

		farmdataPaddocks.createPaddockFeature = createPaddockFeature;

		function createPaddock(paddockFeature, paddocksExisting, paddocksMerged) {
			var name = paddockFeature.properties.name,
				id = paddockFeature.properties.id;
			name = _isDefined(name) ? name : createName();
			id = _isDefined(id) ? id : generateId();
			if(!farmdataPaddockValidator.validateFeature(paddockFeature, paddocksExisting) || !farmdataPaddockValidator.validateFeature(paddockFeature, paddocksMerged)){
				$log.error('creating new paddock failed, paddock data is invalid', paddockFeature);
				return;
			}
			return {
				name: name,
				id: id,
				comment: paddockFeature.properties.comment,
				type: paddockFeature.properties.type,
				area: paddockFeature.properties.area,
				areaUnit: paddockFeature.properties.areaUnit,
				group: paddockFeature.properties.group,
				registered: paddockFeature.properties.registered,
				geometry: farmdataConverter.convertToFarmDataGeometry(paddockFeature.geometry),
				dateLastUpdated: new Date()
			};
		}

		farmdataPaddocks.createPaddock = createPaddock;

		function findPaddock(paddock, paddocks) {
			var found;
			if (!paddock.properties.id) {
				return;
			}
			paddocks.forEach(function (p) {
				if (paddock.properties.id === p.id) {
					found = p;
				}
			});
			return found;
		}

		farmdataPaddocks.findPaddock = findPaddock;

		function updatePaddock(paddockFeature, paddocksExisting, paddocksMerged) {
			var toUpdate = angular.copy(findPaddock(paddockFeature, paddocksExisting));
			if(!farmdataPaddockValidator.validateFeature(paddockFeature, paddocksExisting) || !farmdataPaddockValidator.validateFeature(paddockFeature, paddocksMerged)){
				$log.error('updating paddock failed, paddock data is invalid', paddockFeature);
				return;
			}
			toUpdate.name = paddockFeature.properties.name;
			toUpdate.comment = paddockFeature.properties.comment;
			toUpdate.type = paddockFeature.properties.type;
			toUpdate.area = paddockFeature.properties.area;
			toUpdate.areaUnit = paddockFeature.properties.areaUnit;
			toUpdate.group = paddockFeature.properties.group;
			toUpdate.registered = paddockFeature.properties.registered;
			toUpdate.geometry = farmdataConverter.convertToFarmDataGeometry(paddockFeature.geometry);
			toUpdate.dateLastUpdated = new Date();
			return toUpdate;
		}

		farmdataPaddocks.updatePaddock = updatePaddock;

		function isNew(paddockFeature) {
			return !_isDefined(paddockFeature.properties.id);
		}

		function merge(paddockFeature, paddocksExisting, paddocksMerged) {
//      farmData.paddocks[i].geometry = paddockFeature.geometry;
//      delete farmData.paddocks[i].geometry.crs;

			if (isNew(paddockFeature)) {
				return createPaddock(paddockFeature, paddocksExisting, paddocksMerged);
			}

			return updatePaddock(paddockFeature, paddocksExisting, paddocksMerged)
		}

		farmdataPaddocks.merge = function (farmData, geoJsons) {
			var paddockFeatures = geoJsons.paddocks,
				paddocksExisting = farmData.paddocks,
				paddocksMerged = [],
				paddockGroups = [],
				failed = false;

			paddockFeatures.features.forEach(function (paddockFeature, i) {
				var merged = merge(paddockFeature, paddocksExisting, paddocksMerged);
				if(!_isDefined(merged)){
					$log.error('merging paddocks failed, paddocks data is invalid', paddockFeature, paddocksExisting);
					failed = true;
				}
				paddocksMerged.push(merged);
				if (paddockFeature.properties.group) {
					var paddockGroup = farmdataPaddockGroups.byName(paddockFeature.properties.group.name),
						paddockName = paddockFeature.properties.name;
					if (!_isDefined(paddockGroup)) {
						paddockGroup = farmdataPaddockGroups.create(paddockFeature.properties.group.name);
						paddockGroups.push(paddockGroup);
					}


					if(paddockGroup.paddocks.indexOf(paddockName) < 0) {
						paddockGroup.paddocks.push(paddockFeature.properties.name);
					}

				}
			});

			farmData.paddocks = paddocksMerged;
			farmData.paddockGroups = paddockGroups;

			if(!failed) {
				return farmData;
			}

		};
		
		farmdataPaddocks.byId = function (id, paddocks) {
			return collections.byProperty(paddocks, 'id', id)
		};
		
		farmdataPaddocks.byName = function (name, paddocks) {
			return collections.byProperty(paddocks, 'name', name)
		};
		
		function createFeature(geoJsonGeometry, name, id, type, comment, area, areaUnit, group, registered) {
			var properties;
			if(_isDefined(type) || _isDefined(comment) || _isDefined(area) || _isDefined(areaUnit) || _isDefined(group)){
				properties = {name: name, id: id, type: type, comment: comment, area: area, areaUnit: areaUnit, group: group, registered: registered}
			} else {
				properties = {name: name, id: id, registered: false}
			}
			return {
				"type": "Feature",
				"geometry": angular.copy(geoJsonGeometry),
				"properties": properties
			};
		}
		
		function convertToGeoJsonGeometry(geometry, crs) {
			geometry.crs = {"type": "name", "properties": {"name": crs}};
			return geometry;
		}
		
		
		farmdataPaddocks.toGeoJSON = function toGeoJSON(paddock) {
			$log.info("Extracting farm and paddocks geometry from farmData ...");
			var features = [];
			features.push(createFeature(convertToGeoJsonGeometry(paddock.geometry, paddock.geometry.crs),
				paddock.name, paddock.id, paddock.type, paddock.comment, paddock.area,
				paddock.areaUnit, paddock.group, paddock.registered));
			
			return {
				"type": "FeatureCollection",
				"features": features
			}
		};
		
		farmdataPaddocks.public = {
			/**
			 * Find paddock by name
			 * @method byName
			 * @param {!string} name - name of the paddock to search for
			 * @param {!Array} paddocks - paddocks array to search on
			 * @returns {!object} paddock Object
			 * @public
			 * @static
			 */
			byName: farmdataPaddocks.byName,
			/**
			 * Find paddock by id
			 * @method byId
			 * @param {!string} id - id of the paddock to search for
			 * @param {!Array} paddocks - paddocks array to search on
			 * @returns {!object} paddock Object
			 * @public
			 * @static
			 */
			byId: farmdataPaddocks.byId,
			/**
			 * Returns GeoJSON for a given paddock
			 * @method toGeoJSON
			 * @param {!object} paddock - paddock object
			 * @returns {object} Paddock Feature Object
			 * @public
			 * @static
			 */
			toGeoJSON: farmdataPaddocks.toGeoJSON
		};


//    function _add(geoJsons, geoJsonGeometry) {
//      $log.info('farmdataPaddocks.add item ...', geoJsonGeometry);
//      geoJsons.paddocks.features.push(geoJsonGeometry);
//      return geoJsons;
//    };
//
//    farmdataPaddocks.add = _add

		return farmdataPaddocks;

	});
