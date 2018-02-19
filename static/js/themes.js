proj4.defs('EPSG:25833', '+proj=utm +zone=33 +ellps=WGS84 +towgs84=0,0,0,0,0,0,1 +units=m +no_defs');
var x = 12.0980385366347;
var y = 54.0929626081872;        
var karte = L.tileLayer('https://www.orka-mv.de/geodienste/orkamv/tiles/1.0.0/orkamv/GLOBAL_WEBMERCATOR/{z}/{x}/{y}.png', {
  minZoom: 17,
  attribution: '© Hanse- und Universitätsstadt Rostock (<a rel="license" target="_blank" href="http://creativecommons.org/licenses/by/4.0/deed.de">CC BY 4.0</a>)',
  id: 'karte'
});
var luftbild = L.tileLayer('https://geo.sv.rostock.de/geodienste/luftbild_mv-40/tiles/1.0.0/hro.luftbild_mv-40.luftbild_mv-40/GLOBAL_WEBMERCATOR/{z}/{x}/{y}.png', {
  minZoom: 17,
  attribution: '© <a target="_blank" href="https://www.geoportal-mv.de/portal/Geowebdienste">GeoBasis-DE/M-V</a>',
  id: 'luftbild'
});
var baseMaps = {
  'Karte': karte,
  'Luftbild': luftbild
};
var map;
var markers = new L.FeatureGroup();

$(document).ready(function() {
  $('[data-toggle="tooltip"]').tooltip();
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
  
  if (window.location.hash) {
    var anchor = window.location.hash;
    if ($(anchor).length && anchor.indexOf('theme-') !== -1) {
      showMap($(anchor).data('map-theme-title'));
    }
  }
});

$('.theme').click(function() {
  showMap($(this).data('map-theme-title'));
});

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
      layers: [karte]
    });
    L.control.layers(baseMaps).addTo(map);
  }
  
  map.setView([y, x], 17);
  markers.clearLayers();
  var marker = L.marker([y, x], { title: themeTitle + ' öffnen…' } ).on('click', markerClick);
  markers.addLayer(marker);
  map.addLayer(markers);
}