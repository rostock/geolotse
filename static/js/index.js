// global constants
ROWS = 20;



// functions

function clearResults() {
  $('#results').html('');
}

function populateResults(resultsData) {
  var results = '';
  var categoryIcon = '';
  jQuery.each(resultsData, function(index, item) {
    switch(item.category) {
      case 'api':
        categoryIcon = 'dashboard';
        break;
      case 'application':
        categoryIcon = 'phone';
        break;
      case 'documentation':
        categoryIcon = 'book';
        break;
      case 'download':
        categoryIcon = 'download';
        break;
      case 'geoservice':
        categoryIcon = 'globe';
        break;
      case 'theme':
        categoryIcon = 'map-marker';
        break;
      default:
        categoryIcon = 'list';
    }
    var publicIcon = (item.public === true) ? 'open green' : 'close red';
    results += '<div class="results-entry">';
    results +=   '<a href="' + item.link + '" target="_blank">';
    results +=     '<span class="glyphicon glyphicon-margin-right glyphicon-' + categoryIcon + '"' + ((!MOBILE) ? ' aria-hidden="true" data-toggle="tooltip" data-placement="right" title="' + item.category_label + '"' : '') + '></span><span class="glyphicon glyphicon-margin-right glyphicon-eye-' + publicIcon + '"' + ((!MOBILE) ? ' aria-hidden="true" data-toggle="tooltip" data-placement="right" title="' + item.public_label + '"' : '') + '></span> ' + item.title;
    results +=   '</a>';
    results += '</div>';
  });
  $('#results').html(results);
}

function clearResultsPagination() {
  $('#results-pagination').html('');
}

function populateResultsPagination(hits, start, currentPage) {
  var pages = Math.ceil(hits / ROWS);
  var pagination = '';
  pagination += '<nav>';
  pagination +=   '<ul id="results-pagination-ul" class="pagination pagination-sm">';
  if (currentPage > 1) {
    pagination +=   '<li class="page-item"><span class="page-link" data-page="' + (currentPage - 1) + '">&lt;</span></li>';
  }
  for (i = 1; i <= pages; i++) {
    var fromResults = ((i - 1) * ROWS) + 1;
    var toResults = (i * ROWS > hits) ? hits : i * ROWS;
    if (i === currentPage) {
      pagination += '<li class="page-item active"><span class="page-link" data-page="' + i + '">' + i + '</span></li>';
    } else {
      pagination += '<li class="page-item"><span class="page-link" data-page="' + i + '">' + i + '</span></li>';
    }
  }
  if (currentPage < pages) {
    pagination +=   '<li class="page-item"><span class="page-link" data-page="' + (currentPage + 1) + '">&gt;</span></li>';
  }
  pagination +=   '</ul>';
  pagination += '</nav>';
  $('#results-pagination').html(pagination);
}

function search(query, start) {
  clearResults();
  clearResultsPagination();
  $.ajax({
    url: location.href + '/search',
    data: {
      query: query,
      start: start,
      rows: ROWS
    },
    dataType: 'json',
    success: function(data) {
      populateResults(data.results);
      if (data.hits > ROWS) {
        populateResultsPagination(data.hits, start, ((start / ROWS) + 1));
      }
    }
  });
}



// jQuery events

$('#search-input').keyup(function() {
  var value = $(this).val();
  if (value.length > 2) {
    value = value.toLowerCase().trim();
    if (value != '') {
      search(value, 0);
    }
    else {
      clearResults();
      clearResultsPagination();
    }
  }
  else {
    clearResults();
    clearResultsPagination();
  }
});

$('#clear-search-input').click(function() {
  $('#search-input').val('');
  clearResults();
  clearResultsPagination();
});

$('body').on('click', '#results-pagination-ul > li > span', function(e) {
  var start = ($(e.target).attr('data-page') - 1) * ROWS;
  search($('#search-input').val(), start);
});

if (!MOBILE) {
  $('body').tooltip({
    selector: '[data-toggle="tooltip"]'
  });
}
