$('#clear-search-input').click(function(){
  $('#search-input').val('');
  $('#results').html('');
});

$('#search-input').keyup(function() {
  var value = $(this).val();
  if (value.length > 2) {
    value = value.toLowerCase().trim();
    if (value != '') {
      $.ajax({
        url: 'search',
        data: { query: value },
        dataType: 'json',
        success: function(data) {
          var result = '';
          jQuery.each(data, function(index, item) {
            result += '<div>' + item.title + '</div>';
          });
          $('#results').html(result);
        }
      });
    }
    else {
      $('#results').html('');
    }
  }
  else {
    $('#results').html('');
  }
});