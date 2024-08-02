(function ($, Drupal) {
  Drupal.behaviors.cruiseData = { 
    attach: function(context, settings) {

      console.log(settings['cruiseName'] + ' from cruise page context'); 

    }

  };
})(jQuery, Drupal);