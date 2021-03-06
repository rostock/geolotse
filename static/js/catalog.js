// functions

function processUrlFragmentIdentifier() {
  if (window.location.hash) {
    var anchor = window.location.hash;
    if ($(anchor).length) {
      if (anchor.indexOf('geoservice-') !== -1) {
        $('#geoservice').addClass('in');
        $('#geoservice').attr('aria-expanded', 'true');
        $(anchor).addClass('in');
        $(anchor).attr('aria-expanded', 'true');
        $(document).scrollTop($(anchor).offset().top - (MOBILE ? 145 : 130));
      } else if (anchor.indexOf('inspire-theme-') !== -1) {
        $('#inspire').addClass('in');
        $('#inspire').attr('aria-expanded', 'true');
        $(anchor).addClass('in');
        $(anchor).attr('aria-expanded', 'true');
        $(document).scrollTop($(anchor).offset().top - (MOBILE ? 145 : 130));
      } else if (anchor.indexOf('inspire-service-') !== -1) {
        $('#inspire').addClass('in');
        $('#inspire').attr('aria-expanded', 'true');
        $(anchor).parent().parent().parent().parent().addClass('in');
        $(anchor).parent().parent().parent().parent().attr('aria-expanded', 'true');
        $(anchor).addClass('in');
        $(anchor).attr('aria-expanded', 'true');
        $(document).scrollTop($(anchor).offset().top - (MOBILE ? 145 : 130));
      } else {
        $(anchor).collapse('toggle');
      }
    }
  }
}



// jQuery document ready event

$(document).ready(function() {
  
  $('#loading-modal').modal('show');
  
  // load geoservices
  $.ajax({
    url: URL_BASE + '/geoservices',
    success: function(response) {
      $('#geoservice-accordion').html(response);
      $('#loading-modal').modal('hide');
      processUrlFragmentIdentifier();
    },
    error: function() {
      $('#loading-modal').modal('hide');
      processUrlFragmentIdentifier();
    }
  });
  
  // enable Bootstrap tooltips
  if (!MOBILE) {
    $('[data-toggle="tooltip"]').tooltip();
  }
});



// other jQuery events

$('#application-filter-input').keyup(function() {
  var value = $(this).val().toLowerCase();
  $('#application-accordion > div').each(function() {
    if ($(this).text().toLowerCase().search(value) > -1) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
});

$('#clear-application-filter-input').click(function() {
  $('#application-filter-input').val('');
  $('#application-accordion > div').each(function() {
    $(this).show();
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

$('#clear-external-filter-input').click(function() {
  $('#external-filter-input').val('');
  $('.external-list-group > a').each(function() {
    $(this).show();
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
        $(this).removeClass('hidden');
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
        $(this).addClass('hidden');
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

$('#clear-geoservice-filter-input').click(function() {
  $('#geoservice-filter-input').val('');
  $('#geoservice-accordion > div').each(function() {
    $(this).removeClass('hidden-by-filter-input');
      if (!$(this).hasClass('hidden-by-checkbox')) {
        $(this).show();
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

$('#clear-helper-filter-input').click(function() {
  $('#helper-filter-input').val('');
  $('.helper-list-group > a').each(function() {
    $(this).show();
  });
});

$('#inspire-filter-input').keyup(function() {
  var value = $(this).val().toLowerCase();
  $('#inspire-accordion .inspire-theme-panel').each(function() {
    if ($(this).text().toLowerCase().search(value) > -1) {
      $(this).show();
      $(this).find('.inspire-service-panel').each(function() {
        if ($(this).text().toLowerCase().search(value) > -1) {
          $(this).show();
        } else {
          $(this).hide();
        }
      });
    } else {
      $(this).hide();
    }
  });
});

$('#clear-inspire-filter-input').click(function() {
  $('#inspire-filter-input').val('');
  $('#inspire-accordion .inspire-service-panel').each(function() {
    $(this).show();
  });
  $('#inspire-accordion .inspire-theme-panel').each(function() {
    $(this).show();
  });
});

if (!MOBILE) {
  $('body').tooltip({
    selector: '[data-toggle="tooltip"]'
  });
}
