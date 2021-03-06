/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria
 * @author State of Victoria
 * @version 1.0.0
 */

'use strict';

angular.module('farmbuild.farmdata')
	.factory('farmdataConverter',
	function (validations,
	          $log, $filter,
	          farmdataValidator) {
		var _isDefined = validations.isDefined,
			farmdataConverter = {};

		function createFeatureCollection(geometry) {

		}

		function convertToGeoJsonGeometry(geometry, crs) {
			geometry.crs = {"type": "name", "properties": {"name": crs}};
			return geometry;
		}

		function convertToFarmDataGeometry(geometry) {
			geometry.crs = geometry.crs.properties.name;
			return geometry;
		}

		farmdataConverter.convertToFarmDataGeometry = convertToFarmDataGeometry;

		function createFeature(geoJsonGeometry, name, id, type, comment, area, areaUnit, group, registered, availableNDVI, bbox) {
			var properties;
			if(_isDefined(type) || _isDefined(comment) || _isDefined(area) || _isDefined(areaUnit) || _isDefined(group)){
				properties = {name: name, id: id, type: type, comment: comment, area: area, areaUnit: areaUnit, group: group, registered: registered, availableNDVI: availableNDVI, bbox: bbox}
			} else {
				properties = {name: name, id: id, registered: false}
			}
			return {
				"type": "Feature",
				"geometry": angular.copy(geoJsonGeometry),
				"properties": properties
			};
		}

		farmdataConverter.createFeature = createFeature;


		function toGeoJsons(farmData) {
			$log.info("Extracting farm and paddocks geometry from farmData ...");
			var copied = angular.copy(farmData);

      //if (!farmdataValidator.validate(copied)) {
      //  return undefined;
      //}

			var farmGeometry = copied.geometry,
				paddocks = [];

			copied.paddocks.forEach(function (paddock) {
				paddocks.push(createFeature(convertToGeoJsonGeometry(paddock.geometry, farmGeometry.crs), paddock.name, paddock.id, paddock.type, paddock.comment, paddock.area, paddock.areaUnit, paddock.group, paddock.registered,  paddock.availableNDVI,  paddock.bbox));
			});

			return {
				farm: {
					"type": "FeatureCollection",
					"features": [createFeature(convertToGeoJsonGeometry(farmGeometry, farmGeometry.crs), copied.name)]
				},
				paddocks: {
					"type": "FeatureCollection",
					"features": paddocks
				}
			}
		};
		farmdataConverter.toGeoJsons = toGeoJsons;


		function toGeoJson(farmData) {
			$log.info("Extracting farm and paddocks geometry from farmData ...");
			var copied = angular.copy(farmData);

      if (!farmdataValidator.validate(copied)) {
        return undefined;
      }

			var farmGeometry = copied.geometry,
				features = [];
			features.push(createFeature(convertToGeoJsonGeometry(farmGeometry, farmGeometry.crs), copied.name, copied.id));
			copied.paddocks.forEach(function (paddock) {
				features.push(createFeature(convertToGeoJsonGeometry(paddock.geometry, farmGeometry.crs), paddock.name, paddock.id, paddock.type, paddock.comment, paddock.area, paddock.areaUnit, paddock.group, paddock.registered, paddock.availableNDVI, paddock.bbox));
			});

			return {
				"type": "FeatureCollection",
				"features": features
			}
		};
		farmdataConverter.toGeoJson = toGeoJson;

		function exportGeoJson(document, farmData) {
			var a = document.createElement("a"),
				name = "farmdata-" + farmData.name.replace(/\W+/g, "") + "-" + $filter("date")(new Date(), "yyyyMMddHHmmss") + ".json";
			a.id = "downloadFarmData123456";
			document.body.appendChild(a);
			angular.element(a).attr({
				download: name,
				href: "data:application/json;charset=utf8," + encodeURIComponent(JSON.stringify(toGeoJson(farmData), undefined, 2))
			});
			a.click();
		};
		farmdataConverter.exportGeoJson = exportGeoJson;

		function toKml(farmData) {
			$log.info("Extracting farm and paddocks geometry from farmData ...");
			var copied = angular.copy(farmData)

      if (!farmdataValidator.validate(copied)) {
        return undefined;
      }

			var farmGeometry = copied.geometry,
				features = [];

			features.push(createFeature(convertToGeoJsonGeometry(farmGeometry, farmGeometry.crs), copied.name, copied.id));
			copied.paddocks.forEach(function (paddock) {
				features.push(createFeature(convertToGeoJsonGeometry(paddock.geometry, farmGeometry.crs), paddock.name, paddock.id, paddock.type, paddock.comment, paddock.area, paddock.areaUnit, paddock.group, paddock.registered, paddock.availableNDVI, paddock.bbox));
			});

			return tokml(JSON.parse(JSON.stringify(
				{
					"type": "FeatureCollection",
					"features": features
				}
			)));
		};
		farmdataConverter.toKml = toKml;

		function exportKml(document, farmData) {
			var a = document.createElement("a"),
				name = "farmdata-" + farmData.name.replace(/\W+/g, "") + "-" + $filter("date")(new Date(), "yyyyMMddHHmmss") + ".kml";
			a.id = "downloadFarmData123456";
			document.body.appendChild(a);
			angular.element(a).attr({
				download: name,
				href: "data:application/vnd.google-earth.kml+xml;charset=utf8," + toKml(farmData)
			});
			a.click();
		};
		farmdataConverter.exportKml = exportKml;

		function toFarmData(farmData, geoJsons) {

			$log.info("Converting geoJsons.farm.features[0] and paddocks geojson to farmData ...");
			var farmFeature = geoJsons.farm.features[0];

			farmData.geometry = convertToFarmDataGeometry(farmFeature.geometry);

			farmData = farmdataPaddocks.merge(farmData, geoJsons)

			return farmData;
		};
		farmdataConverter.toFarmData = toFarmData;

		return farmdataConverter;

	});
