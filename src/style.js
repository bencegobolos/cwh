$(document).ready(function() {

  // TODO(bgobolos): Use bootstrap's tooltip.
  $('[data-toggle="tooltip"]').tooltip();

  /* This function is used for the navigation bar. It stops rediricting when an application is selected.
   https://stackoverflow.com/questions/15622100/how-can-i-disable-href-if-onclick-is-executed
   */
  $(".ignore-click").click(function(){
    return false;
  });
});