/**
 * @since 0.0.1
 * @copyright 2015 State of Victoria
 * @author State of Victoria
 * @version 1.0.0
 */

'use strict';

/**
 * farmdata class
 * @module farmdata/session
 */
angular.module('farmbuild.farmdata')
	.factory('farmdataSession',
	function ($log, $filter,
	          farmdataValidator,
	          farmdataConverter,
	          farmdataPaddocks,
	          farmdataPaddockTypes,
	          validations) {
		var farmdataSession = {},
			isDefined = validations.isDefined
			;

		function merge(farmData, geoJsons) {
			$log.info("Merging geoJsons.farm.features[0] and paddocks geojson to farmData ...");

			var farmFeature = geoJsons.farm.features[0];
			farmData.geometry = farmdataConverter.convertToFarmDataGeometry(farmFeature.geometry);


			var farmDataMerged = farmdataPaddocks.merge(farmData, geoJsons);

			if (farmDataMerged) {
				return farmdataSession.update(farmDataMerged);
			}
		};
		farmdataSession.merge = merge;

		farmdataSession.clear = function () {
			sessionStorage.clear();
			return farmdataSession;
		}

		farmdataSession.save = function (farmData) {
			$log.info('saving farmData');

			if (!farmdataValidator.validate(farmData)) {
				$log.error('Unable to save farmData... it is invalid');
				return farmdataSession;
			}
			sessionStorage.setItem('farmData', angular.toJson(farmData));

			return farmdataSession;
		}

		farmdataSession.update = function (farmData) {
			$log.info('update farmData');
			farmData.dateLastUpdated = new Date();
			saveOption(farmData, farmdataPaddockTypes, "paddockTypes");
			farmdataSession.save(farmData);
			return farmdataSession;
		}

		function populateOption(option, service) {
			if (!isDefined(option) || !isDefined(service)) {
				return;
			}
			service.load(option);
		}

		function populateOptions(options) {
			if (!isDefined(options)) {
				return;
			}
			populateOption(options.paddockTypes, farmdataPaddockTypes);
		}

		function saveOption(farmData, service, optionKey) {
			if (!isDefined(service) || !isDefined(farmData) || !isDefined(optionKey)) {
				return;
			}
			farmData[optionKey] = service.toArray();
		}

		farmdataSession.find = function () {
			var json = sessionStorage.getItem('farmData'), farmdata;

			if (json === null) {
				return undefined;
			}

			farmdata = angular.fromJson(json);

			populateOptions(farmdata);

			return farmdata;
		};

		farmdataSession.load = function (farmData) {
			if (!farmdataValidator.validate(farmData)) {
				$log.error('Unable to load farmData... it is invalid');
				return undefined;
			}
			return farmdataSession.save(farmData).find();
		};

		return farmdataSession;

	});
