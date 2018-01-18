$(document).ready(function() {
  $('[data-toggle="tooltip"]').tooltip();
  if (window.location.hash) {
    var anchor = window.location.hash;
    if ($(anchor).length && anchor.indexOf('geoservice-') !== -1) {
      $('#geoservice').addClass('in');
      $('#geoservice').attr('aria-expanded', 'true');
      $(anchor).addClass('in');
      $(anchor).attr('aria-expanded', 'true');
      $(document).scrollTop($(anchor).offset().top - 125);
    } else if ($(anchor).length) {
      $(anchor).collapse('toggle');
    }
  }
});

$('#application-filter-input').keyup(function() {
  var value = $(this).val().toLowerCase();
  $('#application-accordion > div').each(function() {
    if ($(this).text().toLowerCase().search(value) > -1) {
      $(this).removeClass('hidden-by-filter-input');
      if (!$(this).hasClass('hidden-by-checkbox')) {
        $(this).show();
      }
    } else {
      $(this).addClass('hidden-by-filter-input');
      if (!$(this).hasClass('hidden-by-checkbox')) {
        $(this).hide();
      }
    }
  });
});

$('#external-filter-input').keyup(function() {
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
    $('.geoservice-child').each(function() {
      if ($(this).text().search(value) > -1) {
        $(this).show();
        $(this).removeClass('hidden');
        $(this).parent().parent().parent().removeClass('hidden-by-checkbox');
        if (!$(this).parent().parent().parent().hasClass('hidden-by-filter-input')) {
          $(this).parent().parent().parent().show();
        }
      }
    });
    $('.geoservice-group-tag').each(function() {
      if ($(this).text().search(value) > -1) {
        $(this).show();
      }
    });
  }
  else {
    $('.geoservice-child').each(function() {
      if ($(this).text().search(value) > -1) {
        $(this).hide();
        $(this).addClass('hidden');
        if ($(this).parent().find('.geoservice-child:not(.hidden)').length === 0) {
          $(this).parent().parent().parent().addClass('hidden-by-checkbox');
          if (!$(this).parent().parent().parent().hasClass('hidden-by-filter-input')) {
            $(this).parent().parent().parent().hide();
          }
        }
      }
    });
    $('.geoservice-group-tag').each(function() {
      if ($(this).text().search(value) > -1) {
        $(this).hide();
      }
    });
  }
});

$('#geoservice-filter-input').keyup(function() {
  var value = $(this).val().toLowerCase();
  $('#geoservice-accordion > div').each(function() {
    if ($(this).text().toLowerCase().search(value) > -1) {
      $(this).removeClass('hidden-by-filter-input');
      if (!$(this).hasClass('hidden-by-checkbox')) {
        $(this).show();
      }
    } else {
      $(this).addClass('hidden-by-filter-input');
      if (!$(this).hasClass('hidden-by-checkbox')) {
        $(this).hide();
      }
    }
  });
});

$('#helper-filter-input').keyup(function() {
  var value = $(this).val().toLowerCase();
  $('.helper-list-group > a').each(function() {
    if ($(this).text().toLowerCase().search(value) > -1) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
});
