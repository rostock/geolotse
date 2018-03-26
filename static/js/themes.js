// global constants
CURRENT_THEME = 0;
CURRENT_THEME_TITLE = '';
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
ATTRIBUTES_MODAL_TBODY = '';



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
var baseMaps = {};
baseMaps[TRANSLATIONS.map] = mapLayer;
baseMaps[TRANSLATIONS.aerial] = aerialLayer;
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
    title: TRANSLATIONS.location_control
  }
});
locationControl.addTo(map);
map.on('locationerror', locationError);
map.on('click', centerMap);
map.setView([defaultLat, defaultLon], 17);
calculateBbox();
var geojsonLayer = new L.GeoJSON(null, {
  onEachFeature: onEachMapFeature
});
var wmsLayerGroup = new L.LayerGroup();



// functions

function mapOffersPusher(offer, offerIndex) {
  MAP_OFFERS.push([offer, offerIndex]);
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
  $('#offers-container').show();
  $('#offers-container').removeClass('hidden');
  $('.map-headline').hide();
  $('.map-headline').addClass('hidden');
  $('#map-headline-top').show();
  $('#map-headline-top').removeClass('hidden');
  $('#map-container > .panel').removeClass('panel-default');
  $('#map-container > .panel').addClass('panel-info');
  $('#map-container').show();
  $('#map-container').removeClass('hidden');
    
  if (MOBILE && FIRST_THEME) {
    locationControl.start();
  }
  
  FIRST_THEME = false;
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
      getOfferFeatures(item[0], item[1]);
    });
  }
}

function locationError(e) {
  $('#location-error-modal').modal();
}

function onEachMapFeature(feature, layer) {
  var html = '';
  if (feature.properties.meta_type === 'CitySDK') {
    html += '<div>';
    html +=   CITYSDK_API_TARGET_NAME + TRANSLATIONS.advice + ' ' + feature.properties.id;
    html += '</div>';
    html += '<div class="popup-section">';
    html +=   '<ul>';
    html +=     '<li>';
    html +=       TRANSLATIONS.category + ': <span class="popup-italic">' + feature.properties.category + '</span>';
    html +=     '</li>';
    html +=     '<li>';
    html +=       TRANSLATIONS.description + ': <span class="popup-italic">' + feature.properties.description + '</span>';
    html +=     '</li>';
    html +=   '</ul>';
    html += '</div>';
    html += '<div class="popup-section">';
    html +=   TRANSLATIONS.object + ' <span class="popup-italic">' + feature.properties.meta_title + '</span> ' + TRANSLATIONS.theme + ' <span class="popup-italic">' + CURRENT_THEME_TITLE + '</span>';
    html += '</div>';
    html += '<div class="popup-section">';
    html +=   '<a href="' + feature.properties.link + '" target="_blank">';
    html +=     '<span class="glyphicon glyphicon-margin-right glyphicon-link" aria-hidden="true"></span>';
    html +=     TRANSLATIONS.citysdk_link + ' ' + CITYSDK_API_TARGET_NAME;
    html +=   '</a';
    html += '</div>';
  } else if (feature.properties.meta_type === 'WFS') {
    var id = '';
    // ATTENTION
    // you should adopt this block to the various possible names of ID attributes of all the WFS you are requesting
    if (feature.properties.uuid) {
      id = feature.properties.uuid;
    } else if (feature.properties.gml_id) {
      id = feature.properties.gml_id;
    } else if (feature.properties.ogc_fid) {
      id = feature.properties.ogc_fid;
    } else if (feature.properties.gid) {
      id = feature.properties.gid;
    } else if (feature.properties.id) {
      id = feature.properties.id;
    } else if (feature.properties.brw_id) {
      id = feature.properties.brw_id;
    } else if (feature.properties.nummer) {
      id = feature.properties.nummer;
    }
    // END ATTENTION
    html += '<div>';
    html +=   TRANSLATIONS.object + ' <span class="popup-italic">' + feature.properties.meta_title + '</span> ' + TRANSLATIONS.theme + ' <span class="popup-italic">' + CURRENT_THEME_TITLE + '</span>';
    html += '</div>';
    html += '<div class="popup-section">';
    html +=   feature.properties.meta_type + ' ' + TRANSLATIONS.layer + ' <span class="popup-italic">' + feature.properties.meta_featuretype + '</span>';
    html += '</div>';
    html += '<div class="popup-section">';
    html +=   '<table>';
    html +=     '<thead>';
    html +=       '<tr>';
    html +=         '<th>' + TRANSLATIONS.attribute + '</th>';
    html +=         '<th>' + TRANSLATIONS.value + '</th>';
    html +=       '</tr>';
    html +=     '</thead>';
    html +=     '<tbody>';
    var index = 0;
    jQuery.each(feature.properties, function(key, value) {
      if (index < 4) {
        html +=   '<tr>';
        html +=     '<td>' + key + '</td>';
        html +=     '<td>' + value + '</td>';
        html +=   '</tr>';
      } else if (index = 4) {
        html +=   '<tr>';
        html +=     '<td>…</td>';
        html +=     '<td>…</td>';
        html +=   '</tr>';
        return false;
      }
      index++;
    });
    html +=     '</tbody>';
    html +=   '</table>';
    html += '</div>';
    html += '<div id="attributes-modal-link" class="popup-section" onclick="attributesModal(\'' + id + '\', \'' + feature.properties.meta_title + '\', \'' + CURRENT_THEME_TITLE + '\', \'' + feature.properties.meta_type + '\', \'' + feature.properties.meta_featuretype + '\')">';
    html +=   TRANSLATIONS.all_attributes + '…';
    html += '</div>';
    html += '<div class="popup-section">';
    html +=   '<a href="' + feature.properties.meta_link + '" target="_blank">';
    html +=     '<span class="glyphicon glyphicon-margin-right glyphicon-link" aria-hidden="true"></span>';
    html +=     TRANSLATIONS.link + ' ' + feature.properties.meta_type;
    html +=   '</a';
    html += '</div>';
  }
  layer.bindTooltip(TRANSLATIONS.object + ' <span class="popup-italic">' + feature.properties.meta_title + '</span>');
  layer.bindPopup(html);
  layer.on('click', function (e) {
    ATTRIBUTES_MODAL_TBODY =    '<thead>';
    ATTRIBUTES_MODAL_TBODY +=     '<tr>';
    ATTRIBUTES_MODAL_TBODY +=       '<th>' + TRANSLATIONS.attribute + '</th>';
    ATTRIBUTES_MODAL_TBODY +=       '<th>' + TRANSLATIONS.value + '</th>';
    ATTRIBUTES_MODAL_TBODY +=     '</tr>';
    ATTRIBUTES_MODAL_TBODY +=   '</thead>';
    ATTRIBUTES_MODAL_TBODY +=   '<tbody>';
    jQuery.each(feature.properties, function(key, value) {
      if (key.indexOf('meta_') === -1 && value !== '' && value !== null) {
        ATTRIBUTES_MODAL_TBODY += '<tr>';
        ATTRIBUTES_MODAL_TBODY +=   '<td>' + key + '</td>';
        ATTRIBUTES_MODAL_TBODY +=   '<td>' + value + '</td>';
        ATTRIBUTES_MODAL_TBODY += '</tr>';
      }
    });
    ATTRIBUTES_MODAL_TBODY +=   '</tbody>';
    if (!MOBILE) {
      $('#offer-slider').slick('slickGoTo', feature.properties.meta_index);
    }
  });
}

function clearMapFeatures() {
  geojsonLayer.clearLayers();
}

function clearMapLayers() {
  wmsLayerGroup.clearLayers();
}

function populateMapFeatures(features, offerType, offerTitle, offerIndex, wfsLink, wfsFeatureType) {
  if (offerType === 'CitySDK') {
    var geojson = {};
    geojson['type'] = 'FeatureCollection';
    geojson['features'] = [];
    jQuery.each(features, function(index, item) {
      var feature = {
        'type': 'Feature',
        'properties': {
          'meta_type': offerType,
          'meta_title': offerTitle,
          'meta_index': offerIndex,
          'id': item.service_request_id,
          'category': item.service_name,
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
  } else if (offerType === 'WFS') {
    jQuery.each(features, function(index, item) {
      item.properties['meta_type'] = offerType;
      item.properties['meta_title'] = offerTitle;
      item.properties['meta_featuretype'] = wfsFeatureType.split(':')[1];
      item.properties['meta_index'] = offerIndex;
      item.properties['meta_link'] = wfsLink;
    });
    geojsonLayer.addData(features);
  }
  map.addLayer(geojsonLayer);
}

function getOffer(theme, offerId, offerIndex) {
  $.ajax({
    url: URL_BASE + '/offer',
    data: {
      theme: theme,
      id: offerId
    },
    dataType: 'json',
    success: function(data) {
      mapOffersPusher(data[0], offerIndex);
      getOfferFeatures(data[0], offerIndex);
    }
  });
}

function getOffers(theme) {
  $.ajax({
    url: URL_BASE + '/offers',
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
      offer += '<div class="offer" id="offer-' + item.id + '" data-offer-id="' + item.id + '" data-offer-title="' + title + '" data-offer-type="' + item.type + '">';
    } else {
      offer += '<div class="offer" id="offer-' + item.id + '" data-offer-id="' + item.id + '" data-offer-title="' + title + '">';
    }
    offer +=     '<span class="offer-title">';
    offer +=       '<span class="offer-text">';
    if (item.logo != null) {
      offer +=       '<img src="' + URL_LOGOS + item.logo + '" class="offer-logo hidden">';
    }
    if (item.top) {
      offer +=       '<span class="glyphicon glyphicon-margin-right glyphicon-asterisk yellow" aria-hidden="true"></span>' + title;
    } else {
      offer +=       title;
    }
    offer +=       '</span>';
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
      mapOffersPusher(item, index);
      getOfferFeatures(item, index);
    }
  });
  $('#offer-slider').html(offer);
  
  // initialise slick (for offer slider)
  $('#offer-slider').slick({
    dots: !MOBILE ? true : false,
    focusOnSelect: true,
    infinite: true,
    slidesToScroll: 5,
    slidesToShow: 5,
    responsive: [
      {
        breakpoint: 1546,
        settings: {
          dots: !MOBILE ? true : false,
          focusOnSelect: true,
          infinite: true,
          slidesToScroll: 4,
          slidesToShow: 4
        }
      },
      {
        breakpoint: 1246,
        settings: {
          dots: !MOBILE ? true : false,
          focusOnSelect: true,
          infinite: true,
          slidesToScroll: 3,
          slidesToShow: 3
        }
      },
      {
        breakpoint: 946,
        settings: {
          dots: !MOBILE ? true : false,
          focusOnSelect: true,
          infinite: true,
          slidesToScroll: 2,
          slidesToShow: 2
        }
      },
      {
        breakpoint: 646,
        settings: {
          dots: !MOBILE ? true : false,
          focusOnSelect: true,
          infinite: true,
          slidesToScroll: 1,
          slidesToShow: 1
        }
      }
    ]
  });
}

function getOfferFeatures(offer, offerIndex) {
  if (offer.type === 'CitySDK') {
    $('#loading-modal').modal('show');
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
        populateMapFeatures(data, offer.type, offer.title, offerIndex);
        $('#loading-modal').modal('hide');
      },
      error: function() {
        $('#loading-modal').modal('hide');
        if (offer.public === false) {
          mapOffer403Error(offer.title);
        } else {
          mapOfferGeneralError(offer.title);
        }
      }
    });
  } else if (offer.type === 'WFS') {
    $('#loading-modal').modal('show');
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
        populateMapFeatures(data.features, offer.type, offer.title, offerIndex, offer.map_link, offer.layer);
        $('#loading-modal').modal('hide');
      },
      error: function() {
        $('#loading-modal').modal('hide');
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
    wmsLayer.on('tileerror', function() {
      if (offer.public === false) {
        mapOffer403Error(offer.title);
      } else {
        mapOfferGeneralError(offer.title);
      }
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

function attributesModal(object, title, theme, type, featuretype) {
  $('.attributes-modal-text-offer-title').text(title);
  $('.attributes-modal-text-offer-theme').text(theme);
  $('.attributes-modal-text-offer-type').text(type);
  $('.attributes-modal-text-offer-featuretype').text(featuretype);
  $('#attributes-modal table').html(ATTRIBUTES_MODAL_TBODY);
  $('#attributes-modal').modal();
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
    dots: !MOBILE ? true : false,
    focusOnSelect: true,
    infinite: true,
    slidesToScroll: 5,
    slidesToShow: 5,
    responsive: [
      {
        breakpoint: 1546,
        settings: {
          dots: !MOBILE ? true : false,
          focusOnSelect: true,
          infinite: true,
          slidesToScroll: 4,
          slidesToShow: 4
        }
      },
      {
        breakpoint: 1246,
        settings: {
          dots: !MOBILE ? true : false,
          focusOnSelect: true,
          infinite: true,
          slidesToScroll: 3,
          slidesToShow: 3
        }
      },
      {
        breakpoint: 946,
        settings: {
          dots: !MOBILE ? true : false,
          focusOnSelect: true,
          infinite: true,
          slidesToScroll: 2,
          slidesToShow: 2
        }
      },
      {
        breakpoint: 646,
        settings: {
          dots: !MOBILE ? true : false,
          focusOnSelect: true,
          infinite: true,
          slidesToScroll: 1,
          slidesToShow: 1
        }
      }
    ]
  });
  
  // initially hide map
  $('#map-container').hide();
  $('#map-container').addClass('hidden');
  
  // process URL fragment identifier
  if (window.location.hash) {
    var anchor = window.location.hash;
    if ($(anchor).length && anchor.indexOf('theme-') !== -1) {
      $(anchor).click();
    }
  }
});



// other jQuery events

$('#theme-slider').on('click', '.theme', function() {
  if (!$(this).hasClass('active')) {
    CURRENT_THEME = $(this).data('theme-id');
    CURRENT_THEME_TITLE = $(this).data('theme-title');
    $('.theme').removeClass('active');
    $(this).addClass('active');
    $(this).find('.theme-title-flipped').hide();
    $(this).find('.theme-title-flipped').addClass('hidden');
    $(this).find('.theme-title').show();
    $(this).find('.theme-title').removeClass('hidden');
    $('.text-theme-title').text(CURRENT_THEME_TITLE);
    //$('html, body').animate({ scrollTop: ($('#offers-container').offset().top - 60)}, 'slow', function() {
    TOP_MODE = true;
    SHOW_MAP_MODALS = true;
    clearOffers();
    clearMap();
    clearMapFeatures();
    clearMapLayers();
    MAP_OFFERS = [];
    getOffers(CURRENT_THEME);
    map.on('moveend', moveEnd);
    setTimeout( function() {
      $(document).scrollTop($('#offers-container').offset().top - (MOBILE ? 50 : 60));
    }, 1000);
    //});
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
    var offerIndex = $(this).parent().data('slick-index');
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
    $('.offer-logo').hide();
    $('.offer-logo').addClass('hidden');
    $('.offer-link').hide();
    $('.offer-link').addClass('hidden');
    $(this).find('.offer-icon').hide();
    $(this).find('.offer-icon').addClass('hidden');
    $(this).find('.offer-logo').show();
    $(this).find('.offer-logo').removeClass('hidden');
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
      $('#map-container > .panel').removeClass('panel-default');
      $('#map-container > .panel').addClass('panel-info');
      $('#map-container').show();
      $('#map-container').removeClass('hidden');
      getOffer(CURRENT_THEME, offerId, offerIndex);
      map.on('moveend', moveEnd);
    } else {
      $('#map-headline-empty').show();
      $('#map-headline-empty').removeClass('hidden');
      $('#map-container > .panel').removeClass('panel-info');
      $('#map-container > .panel').addClass('panel-default');
      $('#map-container').hide();
      $('#map-container').addClass('hidden');
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
