$(document).ready(function() {
  var anchor = window.location.hash;
  $(anchor).collapse('toggle');
});

$( '#external-filter-input' ).keyup(function() {
  var value = $(this).val().toLowerCase();
  $('.external-list-group > a').each(function() {
    if ($(this).text().toLowerCase().search(value) > -1) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
});

$('.geoservice-checkbox').change(function() {
  var value = $(this).val();
  if ($(this).is(':checked')) {
    $('#geoservice-accordion > div').each(function() {
      if ($(this).text().search(value) > -1) {
        $(this).show();
      }
    });
  }
  else {
    $('#geoservice-accordion > div').each(function() {
      if ($(this).text().search(value) > -1) {
        $(this).hide();
      }
    });
  }
});

$( '#geoservice-filter-input' ).keyup(function() {
  var value = $(this).val().toLowerCase();
  $('#geoservice-accordion > div').each(function() {
    if ($(this).text().toLowerCase().search(value) > -1) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
});
