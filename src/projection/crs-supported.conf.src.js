angular.module('farmbuild.farmdata').
	constant('crsSupported', [
		{
			label: 'GDA 94 Geographics: EPSG:4283',
			name: 'EPSG:4283',
			projection: '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs'
		},
		{
			label: 'Web Mercator: EPSG:3857',
			name: 'EPSG:3857',
			projection: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs'
		}
	]
);