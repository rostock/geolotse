// globals

// constants
BASE_URL = location.href.match(/(http.*)\/.*$/)[1];
if ($('#defining-container').data('mobile')) {
  MOBILE = true;
} else {
  MOBILE = false;
}
CURRENT_THEME = 0;
FIRST_THEME = true;
TOP_MODE = true;
SHOW_MAP_MODALS = true;
MAP_BBOX_LL_LAT = -90;
MAP_BBOX_LL_LON = -180;
MAP_BBOX_UR_LAT = 90;
MAP_BBOX_UR_LON = 180;
FEATURES_BBOX_LL_LAT = -90;
FEATURES_BBOX_LL_LON = -180;
FEATURES_BBOX_UR_LAT = 90;
FEATURES_BBOX_UR_LON = 180;
MAP_OFFERS = [];
CITYSDK_API_KEY = $('#defining-container').data('citysdk-api-key')
CITYSDK_API_TARGET_LINK = $('#defining-container').data('citysdk-api-target-link')

// initialise Leaflet
// ATTENTION
// define your local projection
proj4.defs('EPSG:25833', '+proj=utm +zone=33 +ellps=WGS84 +towgs84=0,0,0,0,0,0,1 +units=m +no_defs');
// END ATTENTION
// ATTENTION
// define your default location for initial map centering
var defaultLat = 54.0929626081872;
var defaultLon = 12.0980385366347;
// END ATTENTION
// ATTENTION
// define both the base map and the base aerial image layer for the map
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
// END ATTENTION
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
  flyTo: true,
  locateOptions: {
    enableHighAccuracy: true
  },
  onLocationError: false,
  setView: 'untilPan',
  strings: {
    title: locationControlTitle
  }
});
locationControl.addTo(map);
map.on('locationerror', locationError);
map.on('click', centerMap);
map.setView([defaultLat, defaultLon], 17);
calculateBbox();
/* var markers = new L.FeatureGroup(); */
var geojsonLayer = new L.GeoJSON();
var wmsLayerGroup = new L.layerGroup();



// functions

function mapOffersPusher(offer) {
  MAP_OFFERS.push(offer);
}

function calculateBbox() {
  MAP_BBOX_LL_LAT = map.getBounds().getSouthWest().lat;
  MAP_BBOX_LL_LON = map.getBounds().getSouthWest().lng;
  MAP_BBOX_UR_LAT = map.getBounds().getNorthEast().lat;
  MAP_BBOX_UR_LON = map.getBounds().getNorthEast().lng;
  latDiff = MAP_BBOX_UR_LAT - MAP_BBOX_LL_LAT;
  lonDiff = MAP_BBOX_UR_LON - MAP_BBOX_LL_LON;
  tempFeaturesBboxLlLat = MAP_BBOX_LL_LAT - latDiff;
  tempFeaturesBboxLlLon = MAP_BBOX_LL_LON - lonDiff;
  tempFeaturesBboxUrLat = MAP_BBOX_UR_LAT + latDiff;
  tempFeaturesBboxUrLon = MAP_BBOX_UR_LON + lonDiff;
  if (FIRST_THEME || MAP_BBOX_LL_LAT < (FEATURES_BBOX_LL_LAT + (latDiff / 2)) || MAP_BBOX_LL_LON < (FEATURES_BBOX_LL_LON + (lonDiff / 2)) || MAP_BBOX_UR_LAT > (FEATURES_BBOX_UR_LAT - (latDiff / 2)) || MAP_BBOX_UR_LON > (FEATURES_BBOX_UR_LON - (lonDiff / 2))) {
    FEATURES_BBOX_LL_LAT = tempFeaturesBboxLlLat;
    FEATURES_BBOX_LL_LON = tempFeaturesBboxLlLon;
    FEATURES_BBOX_UR_LAT = tempFeaturesBboxUrLat;
    FEATURES_BBOX_UR_LON = tempFeaturesBboxUrLon;
  }
}

function centerMap(e) {
  map.setView(e.latlng,5);
}

function clearMap() {
  $('.map-headline').css('color', 'inherit');
  $('.map-headline').hide();
  $('.map-headline').addClass('hidden');
  $('#map-headline-top').show();
  $('#map-headline-top').removeClass('hidden');
  $('#offers-headline').css('color', 'inherit');
    
  if (MOBILE && FIRST_THEME) {
    locationControl.start();
  }
  
  FIRST_THEME = false;
  
  /* markers.clearLayers();
  var marker = L.marker([defaultLat, defaultLon], { title: 'xyz' } ).on('click', markerClick).addTo(markers);
  map.addLayer(markers); */
}

function moveEnd(e) {
  oldFeaturesBboxLlLat = FEATURES_BBOX_LL_LAT;
  oldFeaturesBboxLlLon = FEATURES_BBOX_LL_LON;
  oldFeaturesBboxUrLat = FEATURES_BBOX_UR_LAT;
  oldFeaturesBboxUrLon = FEATURES_BBOX_UR_LON;
  calculateBbox();
  if (oldFeaturesBboxLlLat != FEATURES_BBOX_LL_LAT || oldFeaturesBboxLlLon != FEATURES_BBOX_LL_LON || oldFeaturesBboxUrLat != FEATURES_BBOX_UR_LAT || oldFeaturesBboxUrLon != FEATURES_BBOX_UR_LON) {
    clearMapFeatures();
    clearMapLayers();
    jQuery.each(MAP_OFFERS, function(index, item) {
      getOfferFeatures(item);
    });
  }
}

function locationError(e) {
  $('#location-error-modal').modal();
}

/* function markerClick(e) {
  if (typeof epsg != 'undefined') {
    target_x = x_orig;
    target_y = y_orig;
  } else {
    var transformation = proj4('EPSG:25833', [defaultLon, defaultLat]);
    target_x = transformation[0];
    target_y = transformation[1];
  }
  window.open('https://www.geoport-hro.de/?poi[point]=' + target_x + ',' + target_y + '&poi[scale]=2133', '_blank');
} */

function clearMapFeatures() {
  geojsonLayer.clearLayers();
}

function clearMapLayers() {
  wmsLayerGroup.clearLayers();
}

function populateMapFeatures(features, type) {
  if (type === 'CitySDK') {
    var geojson = {};
    geojson['type'] = 'FeatureCollection';
    geojson['features'] = [];
    jQuery.each(features, function(index, item) {
      var feature = {
        'type': 'Feature',
        'properties': {
          'service_request_id': item.service_request_id,
          'service_name': item.service_name,
          'description': item.description,
          'link': CITYSDK_API_TARGET_LINK + item.service_request_id
        },
        'geometry': {
          'type': 'Point',
          'coordinates': [parseFloat(item.long), parseFloat(item.lat)]
        }
      }
      geojson['features'].push(feature);
    });
    geojsonLayer.addData(geojson);
  } else if (type === 'WFS') {
    geojsonLayer.addData(features);
  }
  map.addLayer(geojsonLayer);
}

function getOffer(theme, id) {
  $.ajax({
    url: BASE_URL + '/offer',
    data: {
      theme: theme,
      id: id
    },
    dataType: 'json',
    success: function(data) {
      mapOffersPusher(data[0]);
      getOfferFeatures(data[0]);
    }
  });
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

function clearOffers() {
  if (!FIRST_THEME) {
    $('#offer-slider').slick('unslick');
    $('#offer-slider').html('');
  }
}

function populateOffers(offersData) {
  var application = false;
  var offer = '';
  jQuery.each(offersData, function(index, item) {
    var title = (item.category === 'application') ? item.group : item.title;
    switch(item.category) {
      case 'api':
        categoryIcon = 'dashboard';
        application = false;
        break;
      case 'application':
        categoryIcon = 'phone';
        application = true;
        break;
      case 'documentation':
        categoryIcon = 'book';
        application = false;
        break;
      case 'download':
        categoryIcon = 'download';
        application = false;
        break;
      case 'geoservice':
        categoryIcon = 'globe';
        application = false;
        break;
      default:
        categoryIcon = 'list';
        application = false;
    }
    var reachableIcon = (item.reachable === true) ? 'ok-sign green' : 'remove-sign red';
    var publicIcon = (item.public === true) ? 'open green' : 'close red';
    offer += '<div>';
    if (item.type) {
      offer +=   '<div class="offer" id="offer-' + item.id + '" data-offer-id="' + item.id + '" data-offer-title="' + title + '" data-offer-type="' + item.type + '">';
    } else {
      offer +=   '<div class="offer" id="offer-' + item.id + '" data-offer-id="' + item.id + '" data-offer-title="' + title + '">';
    }
    offer +=     '<span class="offer-title">';
    offer +=       '<span class="offer-text">' + title + '</span>';
    offer +=       '<span class="glyphicon glyphicon-' + categoryIcon + ' offer-icon"></span>';
    if (application === true) {
      for (i = 0; i < item.links.length; i++) {
        var innerReachableIcon = (item.links[i].reachable === true) ? 'ok-sign green' : 'remove-sign red';
        var innerPublicIcon = (item.links[i].public === true) ? 'open green' : 'close red';
        offer +=   '<div class="offer-link' + ((i == 0) ? ' first' : '') + ' hidden">';
        offer +=     '<a href="' + item.links[i].link + '" target="_blank">';
        offer +=     '<span class="glyphicon glyphicon-margin-right glyphicon-' + innerReachableIcon + '"' + ((!MOBILE) ? ' aria-hidden="true" data-toggle="tooltip" data-placement="right" title="' + item.links[i].reachable_label + ': ' + item.links[i].reachable_last_check + '"' : '') + '></span><span class="glyphicon glyphicon-margin-right glyphicon-eye-' + innerPublicIcon + '"' + ((!MOBILE) ? ' aria-hidden="true" data-toggle="tooltip" data-placement="right" title="' + item.links[i].public_label + '"' : '') + '></span> ' + item.links[i].title;
        offer +=     '</a>';
        offer +=   '</div>';
      }
    } else {
      offer +=     '<div class="offer-link first hidden">';
      offer +=       '<a href="' + item.link + '" target="_blank">';
      offer +=       '<span class="glyphicon glyphicon-margin-right glyphicon-' + reachableIcon + '"' + ((!MOBILE) ? ' aria-hidden="true" data-toggle="tooltip" data-placement="right" title="' + item.reachable_label + ': ' + item.reachable_last_check + '"' : '') + '></span><span class="glyphicon glyphicon-margin-right glyphicon-eye-' + publicIcon + '"' + ((!MOBILE) ? ' aria-hidden="true" data-toggle="tooltip" data-placement="right" title="' + item.public_label + '"' : '') + '></span> ' + item.link_label;
      offer +=       '</a>';
      offer +=     '</div>';
    }
    offer +=     '</span>';
    offer +=     '<span class="offer-title-flipped hidden">';
    offer +=       '<span class="offer-text">' + item.category_label + '</span>';
    offer +=     '</span>';
    offer +=   '</div>';
    offer += '</div>';
    if (item.type != null && item.top) {
      mapOffersPusher(item);
      getOfferFeatures(item);
    }
  });
  $('#offer-slider').html(offer);
  
  // initialise slick (for offer slider)
  $('#offer-slider').slick({
    dots: false,
    infinite: true,
    focusOnSelect: true,
    focusOnChange: true,
    slidesToScroll: 5,
    slidesToShow: 5,
    responsive: [
      {
        breakpoint: 1546,
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
        breakpoint: 1246,
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
        breakpoint: 946,
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
        breakpoint: 646,
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
}

function getOfferFeatures(offer) {
  if (offer.type === 'CitySDK') {
    $.ajax({
      // ATTENTION
      // cutting the last part of the URL path might not be necessary for the CitySDK endpoint you are requesting
      url: offer.map_link.match(/(http.*)\/.*$/)[1] + '/requests.json',
      // END ATTENTION
      data: {
        api_key: CITYSDK_API_KEY,
        // ATTENTION
        // latitude and longitude are for sure not flipped around in the CitySDK endpoint you are requesting ;-)
        lat: map.getCenter().lng,
        long: map.getCenter().lat,
        // END ATTENTION
        radius: map.getCenter().distanceTo(L.latLng(FEATURES_BBOX_UR_LAT, FEATURES_BBOX_UR_LON))
      },
      dataType: 'json',
      success: function(data) {
        populateMapFeatures(data, offer.type);
      },
      error: function() {
        if (offer.public === false) {
          mapOffer403Error(offer.title);
        } else {
          mapOfferGeneralError(offer.title);
        }
      }
    });
  } else if (offer.type === 'WFS') {
    var defaultWfsParameters = {
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: offer.layer,
      // ATTENTION
      // name for GeoJSON format may differ in the WFS you are requesting
      outputFormat: 'GeoJSON',
      // END ATTENTION
      srsName: 'urn:ogc:def:crs:EPSG::4326'
    };
    var currentWfsParameters = {
      bbox: FEATURES_BBOX_LL_LAT + ',' + FEATURES_BBOX_LL_LON + ',' + FEATURES_BBOX_UR_LAT + ',' + FEATURES_BBOX_UR_LON + ',' + ',urn:ogc:def:crs:EPSG::4326'
    };
    var wfsParameters = L.Util.extend(defaultWfsParameters, currentWfsParameters);
    $.ajax({
      url: offer.map_link + L.Util.getParamString(wfsParameters),
      dataType: 'json',
      success: function(data) {
        populateMapFeatures(data.features, offer.type);
      },
      error: function() {
        if (offer.public === false) {
          mapOffer403Error(offer.title);
        } else {
          mapOfferGeneralError(offer.title);
        }
      }
    });
  } else if (offer.type === 'WMS') {
    var wmsLayer = L.tileLayer.wms(offer.map_link, {
      crs: L.CRS.EPSG4326,
      layers: offer.layer,
      format: 'image/png',
      transparent: true,
      version: '1.3.0'
    });
    wmsLayerGroup.addLayer(wmsLayer);
    map.addLayer(wmsLayerGroup);
  }
}

function mapOffer403Error(title) {
  if (TOP_MODE && SHOW_MAP_MODALS) {
    $('#map-top-403-error-modal').modal();
    TOP_MODE = false;
    SHOW_MAP_MODALS = false;
  } else if (SHOW_MAP_MODALS) {
    $('#map-offer-403-error-modal').modal();
    SHOW_MAP_MODALS = false;
  }
}

function mapOfferGeneralError(title) {
  if (TOP_MODE && SHOW_MAP_MODALS) {
    $('#map-top-general-error-modal').modal();
    TOP_MODE = false;
    SHOW_MAP_MODALS = false;
  } else if (SHOW_MAP_MODALS) {
    $('#map-offer-general-error-modal').modal();
    SHOW_MAP_MODALS = false;
  }
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
    // ATTENTION
    // define the URL of the address search API you are requesting and the parameters used
    url: 'https://geo.sv.rostock.de/suche/server.php',
    data: {
      searchtext: searchtext
    },
    // END ATTENTION
    dataType: 'json',
    success: function(data) {
      populateResults(data.array);
    },
    error: function() {
      searchError();
    }
  });
}

function searchError(e) {
  $('#search-error-modal').modal();
}



// jQuery document ready event

$(document).ready(function() {
  
  // enable Bootstrap tooltips
  if (!MOBILE) {
    $('[data-toggle="tooltip"]').tooltip();
  }
  
  // initialise slick (for theme slider)
  $('#theme-slider').slick({
    dots: false,
    infinite: true,
    focusOnSelect: true,
    focusOnChange: true,
    slidesToScroll: 5,
    slidesToShow: 5,
    responsive: [
      {
        breakpoint: 1434,
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
        breakpoint: 1154,
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
        breakpoint: 874,
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
        breakpoint: 598,
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

$('#theme-slider').on('click', '.theme', function() {
  if (!$(this).hasClass('active')) {
    CURRENT_THEME = $(this).data('theme-id');
    var themeTitle = $(this).data('theme-title');
    $('.theme').removeClass('active');
    $(this).addClass('active');
    $(this).find('.theme-title-flipped').hide();
    $(this).find('.theme-title-flipped').addClass('hidden');
    $(this).find('.theme-title').show();
    $(this).find('.theme-title').removeClass('hidden');
    $('.text-theme-title').text(themeTitle);
    $('.map-headline').hide();
    $('.map-headline').addClass('hidden');
    $('#map-headline-top').show();
    $('#map-headline-top').removeClass('hidden');
    TOP_MODE = true;
    SHOW_MAP_MODALS = true;
    clearOffers();
    clearMap();
    clearMapFeatures();
    clearMapLayers();
    MAP_OFFERS = [];
    getOffers(CURRENT_THEME);
    map.on('moveend', moveEnd);
    $('html, body').animate({ scrollTop: ($('#map-headline-top').offset().top - 55)}, 'slow');
  }
});

if (!MOBILE) {
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
}

$('#offer-slider').on('click', '.offer', function() {
  if (!$(this).hasClass('active')) {
    var offerId = $(this).data('offer-id');
    var offerTitle = $(this).data('offer-title');
    $('.offer').removeClass('active');
    $(this).addClass('active');
    $(this).find('.offer-title-flipped').hide();
    $(this).find('.offer-title-flipped').addClass('hidden');
    $(this).find('.offer-title').show();
    $(this).find('.offer-title').removeClass('hidden');
    $('.offer-icon').show();
    $('.offer-icon').removeClass('hidden');
    $('.offer-link').hide();
    $('.offer-link').addClass('hidden');
    $(this).find('.offer-icon').hide();
    $(this).find('.offer-icon').addClass('hidden');
    $(this).find('.offer-link').show();
    $(this).find('.offer-link').removeClass('hidden');
    $('.text-offer-title').text(offerTitle);
    $('.map-headline').hide();
    $('.map-headline').addClass('hidden');
    TOP_MODE = false;
    SHOW_MAP_MODALS = true;
    clearMapFeatures();
    clearMapLayers();
    MAP_OFFERS = [];
    if ($(this).data('offer-type')) {
      $('#map-headline-offer').show();
      $('#map-headline-offer').removeClass('hidden');
      getOffer(CURRENT_THEME, offerId);
      map.on('moveend', moveEnd);
    } else {
      $('#map-headline-empty').show();
      $('#map-headline-empty').removeClass('hidden');
    }
  }
});

if (!MOBILE) {
  $('#offer-slider').on('mouseenter', '.offer', function() {
    if (!$(this).hasClass('active')) {
      $(this).find('.offer-title').hide();
      $(this).find('.offer-title').addClass('hidden');
      $(this).find('.offer-title-flipped').show();
      $(this).find('.offer-title-flipped').removeClass('hidden');
    }
  });
  $('#offer-slider').on('mouseleave', '.offer', function() {
    if (!$(this).hasClass('active')) {
      $(this).find('.offer-title-flipped').hide();
      $(this).find('.offer-title-flipped').addClass('hidden');
      $(this).find('.offer-title').show();
      $(this).find('.offer-title').removeClass('hidden');
    }
  });
}

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

$('body').on('click', '.results-entry', function(e) {
  var transformation_ll = proj4('EPSG:25833', 'EPSG:4326', [$(e.target).data('x1'), $(e.target).data('y1')]);
  var transformation_ur = proj4('EPSG:25833', 'EPSG:4326', [$(e.target).data('x2'), $(e.target).data('y2')]);
  map.fitBounds([[transformation_ll[1], transformation_ll[0]], [transformation_ur[1], transformation_ur[0]]]);
});

if (!MOBILE) {
  $('body').tooltip({
    selector: '[data-toggle="tooltip"]'
  });
}

$('#geoportal-link').click(function() {
  var transformation = proj4('EPSG:4326', 'EPSG:25833', [map.getCenter().lng, map.getCenter().lat]);
  window.open('https://www.geoport-hro.de/?center=' + transformation[0] + ',' + transformation[1] + '&scale=2133', '_blank');
});
