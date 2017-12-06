$(document).ready(function() {
  var anchor = window.location.hash;
  $(anchor).collapse('toggle');
});

$( "#external-filter-input" ).keyup(function() {
  var value = $(this).val().toLowerCase();
  $(".external-list-group > a").each(function() {
    if ($(this).text().toLowerCase().search(value) > -1) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
});
