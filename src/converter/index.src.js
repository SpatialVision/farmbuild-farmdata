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
                  $log) {
            var _isDefined = validations.isDefined,
                farmdataConverter = {};

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
                if (_isDefined(type) || _isDefined(comment) || _isDefined(area) || _isDefined(areaUnit) || _isDefined(group)) {
                    properties = {
                        name: name,
                        id: id,
                        type: type,
                        comment: comment,
                        area: area,
                        areaUnit: areaUnit,
                        group: group,
                        registered: registered,
                        availableNDVI: availableNDVI,
                        bbox: bbox
                    }
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

                var farmGeometry = copied.geometry,
                    paddocks = [];

                copied.paddocks.forEach(function (paddock) {
                    paddocks.push(createFeature(convertToGeoJsonGeometry(paddock.geometry, farmGeometry.crs), paddock.name, paddock.id, paddock.type, paddock.comment, paddock.area, paddock.areaUnit, paddock.group, paddock.registered, paddock.availableNDVI, paddock.bbox));
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

            return farmdataConverter;

        });
