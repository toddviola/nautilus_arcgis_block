import WebMap from "@arcgis/core/WebMap.js";
import MapView from "@arcgis/core/views/MapView.js";
import Fullscreen from "@arcgis/core/widgets/Fullscreen.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";

(function ($, Drupal) {
  Drupal.behaviors.shipLocation = { 
    attach: function(context, settings) {

        //console.log(settings);

        const DEFAULT_ZOOM = 8
        const REFRESH_INTERVAL_MINUTES = 5
        // Recenter on ship approximatly every 5 minutes.
        // * "Approximately" because the centerOnShip function awaits some Promises before actually
        // recentering the map so it may be a bit longer than 5 minutes.
        const RECENTER_INTERVAL_MILLISECONDS = REFRESH_INTERVAL_MINUTES * 60 * 1000;  

        let recenterTimeout;
        let userHasInteracted;
        let showShipTrack = settings['showShipTrack'];
        
        const webmap = new WebMap({
            portalItem: {
                id: '2d78b7a7b70847788ad9af95bf6e4ba0',
            }
        });

        const vehiclePositionsLayer = new FeatureLayer({
            portalItem: {
                id: '871f7733569c437f9eeebf94d72cb6bc',
            },
        });

        const view = new MapView({
            container: 'ship-location-map-container',
            map: webmap,
        });

        const fullscreen = new Fullscreen({
          view: view,
        });
        view.ui.add(fullscreen, "top-right");

        async function centerOnShip() {
            const query = vehiclePositionsLayer.createQuery();
            query.where = "vehicle = 'Nautilus'";
            const {extent} = await vehiclePositionsLayer.queryExtent(query);
            await view.goTo(extent);
            view.zoom = DEFAULT_ZOOM;
            if (userHasInteracted) {return;}
            recenterTimeout = setTimeout(centerOnShip, RECENTER_INTERVAL_MILLISECONDS, webmap, view);
        }

        async function startUp() {
            await webmap.load();
            setViewFocus();

            if (showShipTrack) {
              // Drupal block setting showShipTrack is switched on.    
            }

        }

        async function setViewFocus() {
            await centerOnShip();

            await reactiveUtils.whenOnce(() => view.interacting || view.zoom != DEFAULT_ZOOM);
            userHasInteracted = true;
            clearTimeout(recenterTimeout);
        }

        startUp();

    }
  };
})(jQuery, Drupal);