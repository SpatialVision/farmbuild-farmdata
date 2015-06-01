/**
 * @since 0.0.1
 * @copyright 2015 Spatial Vision, Inc. http://spatialvision.com.au
 * @license The MIT License
 * @author Spatial Vision
 * @version 1.0.0
 */

'use strict';

/**
 * farmdataPaddocks class
 * @module farmdataPaddocks
 */
angular.module('farmbuild.farmdata')
  .factory('farmdataPaddocks',
  function ($log,
            collections,
            validations,
            farmdataConverter) {
    var farmdataPaddocks =
      {
      },
      isEmpty = validations.isEmpty,
      isDefined = validations.isDefined
      ;

    function createName() {
      return 'Paddock ' + new Date().getTime();
    }

    function createPaddockFeature(geoJsonGeometry) {
      return farmdataConverter.createFeature(geoJsonGeometry, createName());
    }
    farmdataPaddocks.createPaddockFeature = createPaddockFeature;

    function createPaddock(paddockFeature) {
      var name = paddockFeature.properties.name,
        name = isDefined(name)?name:createName()
        ;
      return {name: name,
        geometry:farmdataConverter.convertToFarmDataGeometry(paddockFeature.geometry),
        dateLastUpdated:new Date()};
    }
    farmdataPaddocks.createPaddock = createPaddock;

    function findPaddock(paddock, paddocks) {
      var found;
      if(!paddock.properties._id){
        return;
      }
      paddocks.forEach(function(p){
        if(paddock.properties._id === p._id){
          found = p;
        }
      });
      return found;
    }
    farmdataPaddocks.findPaddock = findPaddock;

    function updatePaddock(paddockFeature, paddocksExisting) {
      var toUpdate = angular.copy(findPaddock(paddockFeature, paddocksExisting));
      toUpdate.name = paddockFeature.name;
      toUpdate.geometry = paddockFeature.geometry;
      return toUpdate;
    }
    farmdataPaddocks.updatePaddock = updatePaddock;

    function isNew(paddockFeature) {
      return !isDefined(paddockFeature.properties._id);
    }

    function merge(paddockFeature, paddocksExisting) {
//      farmData.paddocks[i].geometry = paddockFeature.geometry;
//      delete farmData.paddocks[i].geometry.crs;

      if (isNew(paddockFeature)) {
        return createPaddock(paddockFeature);
      }

      return updatePaddock(paddockFeature, paddocksExisting)
    }

    farmdataPaddocks.merge = function(farmData, geoJsons) {
      var paddockFeatures = geoJsons.paddocks,
        paddocksExisting = farmData.paddocks,
        paddocksMerged = [];

      paddockFeatures.features.forEach(function (paddockFeature, i) {
        paddocksMerged.push(merge(paddockFeature, paddocksExisting));
      });

      farmData.paddocks = paddocksMerged;

      return farmData;

    }


//    function _add(geoJsons, geoJsonGeometry) {
//      $log.info('farmdataPaddocks.add item ...', geoJsonGeometry);
//      geoJsons.paddocks.features.push(geoJsonGeometry);
//      return geoJsons;
//    };
//
//    farmdataPaddocks.add = _add

    return farmdataPaddocks;

  });
