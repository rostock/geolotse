// globals

// constants
BASE_URL = location.href.match(/(http.*)\/.*$/)[1];
if ($('#defining-container').data('mobile')) {
  MOBILE = true;
} else {
  MOBILE = false;
}
FIRST_THEME = true;

// initialise Leaflet
proj4.defs('EPSG:25833', '+proj=utm +zone=33 +ellps=WGS84 +towgs84=0,0,0,0,0,0,1 +units=m +no_defs');
var defaultX = 12.0980385366347;
var defaultY = 54.0929626081872;       
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
var locationControlTitle = $('#location-control-title').data('translation');
var baseMaps = {};
baseMaps[mapLayerTitle] = mapLayer;
baseMaps[aerialLayerTitle] = aerialLayer;
var map;
map = L.map('map', {
  layers: [mapLayer]
}).fitWorld();
L.control.layers(baseMaps).addTo(map);
var locationControl = L.control.locate({
  drawCircle: false,
  drawMarker: false,
  locateOptions: {
    watch: true,
    enableHighAccuracy: true
  },
  onLocationError: false,
  setView: 'always',
  strings: {
    title: locationControlTitle
  }
});
locationControl.addTo(map);
map.on('locationerror', onLocationError);
map.on('click', centerMap);
map.setView([defaultY, defaultX], 17);
var markers = new L.FeatureGroup();



// functions

function centerMap(e) {
  map.setView(e.latlng,5);
}

/*function markerClick(e) {
  if (typeof epsg != 'undefined') {
    target_x = x_orig;
    target_y = y_orig;
  } else {
    var transformation = proj4('EPSG:25833', [defaultX, defaultY]);
    target_x = transformation[0];
    target_y = transformation[1];
  }
  window.open('https://www.geoport-hro.de/?poi[point]=' + target_x + ',' + target_y + '&poi[scale]=2133', '_blank');
}*/

function onLocationError(e) {
  $('#location-error-modal').modal();
}

function populateMap() {
  $('#map-headline').css('color', 'inherit');
  $('#offers-headline').css('color', 'inherit');
    
  if (MOBILE && FIRST_THEME) {
   locationControl.start();
  }
  
  FIRST_THEME = false;
  
  /*markers.clearLayers();
  var marker = L.marker([defaultY, defaultX], { title: 'xyz' } ).on('click', markerClick).addTo(markers);
  map.addLayer(markers);*/
}

function getOffers(theme) {
  $.ajax({
    url: BASE_URL + '/offers',
    data: {
      theme: theme
    },
    dataType: 'json',
    success: function(data) {
      populateOffers(data.offers);
    }
  });
}

function populateOffers(offersData) {
  var offers = '';
  jQuery.each(offersData, function(index, item) {
    //results += '<div class="results-entry" data-x1="' + item.bbox[0] + '" data-y1="' + item.bbox[1] + '" data-x2="' + item.bbox[2] + '" data-y2="' + item.bbox[3] + '">';
    //results +=   item.label;
    //results += '</div>';
    offers += item.title;
  });
  $('#offer-slider').html(offers);
}

function clearResults() {
  $('#results').html('');
}

function populateResults(resultsData) {
  var results = '';
  jQuery.each(resultsData, function(index, item) {
    results += '<div class="results-entry" data-x1="' + item.bbox[0] + '" data-y1="' + item.bbox[1] + '" data-x2="' + item.bbox[2] + '" data-y2="' + item.bbox[3] + '">';
    results +=   item.label;
    results += '</div>';
  });
  $('#results').html(results);
}

function search(searchtext) {
  clearResults();
  $.ajax({
    url: 'https://geo.sv.rostock.de/suche/server.php',
    data: {
      searchtext: searchtext
    },
    dataType: 'json',
    success: function(data) {
      populateResults(data.array);
    }
  });
}



// jQuery document ready event

$(document).ready(function() {
  
  // enable Bootstrap tooltips
  if (!MOBILE) {
    $('[data-toggle="tooltip"]').tooltip();
  }
  
  // initialise slick
  $('.slider').slick({
    dots: false,
    infinite: true,
    focusOnSelect: true,
    focusOnChange: true,
    slidesToScroll: 5,
    slidesToShow: 5,
    responsive: [
      {
        breakpoint: 1424,
        settings: {
          dots: false,
          infinite: true,
          focusOnSelect: true,
          focusOnChange: true,
          slidesToScroll: 4,
          slidesToShow: 4
        }
      },
      {
        breakpoint: 1144,
        settings: {
          dots: false,
          infinite: true,
          focusOnSelect: true,
          focusOnChange: true,
          slidesToScroll: 3,
          slidesToShow: 3
        }
      },
      {
        breakpoint: 864,
        settings: {
          dots: false,
          infinite: true,
          focusOnSelect: true,
          focusOnChange: true,
          slidesToScroll: 2,
          slidesToShow: 2
        }
      },
      {
        breakpoint: 588,
        settings: {
          dots: false,
          infinite: true,
          focusOnSelect: true,
          focusOnChange: true,
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
      $(anchor).trigger('click');
    }
  }
});



// other jQuery events

$('.theme').click(function() {
  if (!$(this).hasClass('active')) {
    var themeId = $(this).data('theme-id');
    var themeTitle = $(this).data('theme-title');
    $('.theme').removeClass('active');
    $(this).addClass('active');
    $(this).find('.theme-title-flipped').hide();
    $(this).find('.theme-title-flipped').addClass('hidden');
    $(this).find('.theme-title').show();
    $(this).find('.theme-title').removeClass('hidden');
    $('#map-headline-theme-title').text(themeTitle + ':');
    $('#offers-headline-theme-title').text(themeTitle + ':');
    getOffers(themeId);
    populateMap();
    $('html, body').animate({ scrollTop: ($('#map-headline').offset().top - 55)}, 'slow');
  }
});

$('.theme').hover(
  function() {
    if (!$(this).hasClass('active')) {
      $(this).find('.theme-title').hide();
      $(this).find('.theme-title').addClass('hidden');
      $(this).find('.theme-title-flipped').show();
      $(this).find('.theme-title-flipped').removeClass('hidden');
    }
  }, function() {
    if (!$(this).hasClass('active')) {
      $(this).find('.theme-title-flipped').hide();
      $(this).find('.theme-title-flipped').addClass('hidden');
      $(this).find('.theme-title').show();
      $(this).find('.theme-title').removeClass('hidden');
    }
  }
);

$('#address-input').keyup(function() {
  var value = $(this).val();
  if (value.length > 2) {
    value = value.toLowerCase().trim();
    if (value != '') {
      search(value);
    }
    else {
      clearResults();
    }
  }
  else {
    clearResults();
  }
});

$('#clear-address-input').click(function() {
  $('#address-input').val('');
  clearResults();
});

$('#geoportal-link').click(function() {
  var transformation = proj4('EPSG:4326', 'EPSG:25833', [map.getCenter().lng, map.getCenter().lat]);
  window.open('https://www.geoport-hro.de/?center=' + transformation[0] + ',' + transformation[1] + '&scale=2133', '_blank');
});

$('body').on('click', '.results-entry', function(e) {
  var transformation_ll = proj4('EPSG:25833', 'EPSG:4326', [$(e.target).data('x1'), $(e.target).data('y1')]);
  var transformation_ur = proj4('EPSG:25833', 'EPSG:4326', [$(e.target).data('x2'), $(e.target).data('y2')]);
  map.fitBounds([[transformation_ll[1], transformation_ll[0]], [transformation_ur[1], transformation_ur[0]]]);
});
