// globals

// constants
LANG_CODE = location.href.match(/([^\/]*)\/*$/)[1];
if ($('#defining-container').data('mobile')) {
  MOBILE = true;
} else {
  MOBILE = false;
}

// initialise Leaflet
proj4.defs('EPSG:25833', '+proj=utm +zone=33 +ellps=WGS84 +towgs84=0,0,0,0,0,0,1 +units=m +no_defs');        
var mapLayer = L.tileLayer('https://www.orka-mv.de/geodienste/orkamv/tiles/1.0.0/orkamv/GLOBAL_WEBMERCATOR/{z}/{x}/{y}.png', {
  minZoom: 17,
  attribution: '© Hanse- und Universitätsstadt Rostock (<a rel="license" target="_blank" href="http://creativecommons.org/licenses/by/4.0/deed.de">CC BY 4.0</a>)',
  id: 'mapLayer'
});
var aerialLayer = L.tileLayer('https://geo.sv.rostock.de/geodienste/luftbild_mv-40/tiles/1.0.0/hro.luftbild_mv-40.luftbild_mv-40/GLOBAL_WEBMERCATOR/{z}/{x}/{y}.png', {
  minZoom: 17,
  attribution: '© <a target="_blank" href="https://www.geoportal-mv.de/portal/Geowebdienste">GeoBasis-DE/M-V</a>',
  id: 'aerialLayer'
});
var mapLayerTitle = $('#map-layer-title').data('translation');
var aerialLayerTitle = $('#aerial-layer-title').data('translation');
var baseMaps = {};
baseMaps[mapLayerTitle] = mapLayer;
baseMaps[aerialLayerTitle] = aerialLayer;
var map;
var markers = new L.FeatureGroup();



// functions

function markerClick(e) {
  if (typeof epsg != 'undefined') {
    target_x = x_orig;
    target_y = y_orig;
  } else {
    var transformation = proj4('EPSG:25833', [x, y]);
    target_x = transformation[0];
    target_y = transformation[1];
  }
  window.open('https://www.geoport-hro.de/?poi[point]=' + target_x + ',' + target_y + '&poi[scale]=2133', '_blank');
}

function showMap(themeTitle) {
  $('#map-container').show();
  $('#map-container').removeClass('hidden');
  
  if (!map) {
    map = L.map('map', {
      layers: [mapLayer]
    });
    L.control.layers(baseMaps).addTo(map);
  }
  
  var x = 12.0980385366347;
  var y = 54.0929626081872;
  
  map.setView([y, x], 17);
  markers.clearLayers();
  var marker = L.marker([y, x], { title: themeTitle } ).on('click', markerClick);
  markers.addLayer(marker);
  map.addLayer(markers);
}



// jQuery document ready event

$(document).ready(function() {
  
  // enable Bootstrap tooltips
  $('[data-toggle="tooltip"]').tooltip();
  
  // initialise slick
  $('.slider').slick({
    dots: false,
    infinite: true,
    slidesToScroll: 5,
    slidesToShow: 5,
    responsive: [
      {
        breakpoint: 1424,
        settings: {
          dots: true,
          infinite: true,
          slidesToScroll: 4,
          slidesToShow: 4
        }
      },
      {
        breakpoint: 1144,
        settings: {
          dots: true,
          infinite: true,
          slidesToScroll: 3,
          slidesToShow: 3
        }
      },
      {
        breakpoint: 864,
        settings: {
          dots: true,
          infinite: true,
          slidesToScroll: 2,
          slidesToShow: 2
        }
      },
      {
        breakpoint: 588,
        settings: {
          dots: true,
          infinite: true,
          slidesToScroll: 1,
          slidesToShow: 1
        }
      }
    ]
  });
  
  // process URL fragment identifier
  if (window.location.hash) {
    var anchor = window.location.hash;
    if ($(anchor).length && anchor.indexOf('theme-') !== -1) {
      showMap($(anchor).data('map-theme-title'));
    }
  }
});



// other jQuery events

$('.theme').click(function() {
  showMap($(this).data('map-theme-title'));
});
