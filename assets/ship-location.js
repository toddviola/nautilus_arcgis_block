import WebMap from "@arcgis/core/WebMap.js";
import MapView from "@arcgis/core/views/MapView.js";
import Fullscreen from "@arcgis/core/widgets/Fullscreen.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";

(function ($, Drupal) {
  Drupal.behaviors.shipLocation = { 
    attach: function(context, settings) {

        //console.log(settings);

        const DEFAULT_ZOOM = 8;
        // Recenter on ship approximatly every 30 seconds.
        // * "Approximately" because the centerOnShip function awaits some Promises before actually
        // recentering the map so it may be a bit longer than 30 seconds.
        // const RECENTER_INTERVAL = 30 * 1000;  

        // Recenter on ship approximately every 180 seconds. 
        // This is a test to see if the requests to the service go down. 
        const RECENTER_INTERVAL = 180 * 1000;  

        let recenterTimeout;
        let userHasInteracted;
        let vehiclePositionsLayer;
        let showShipTrack = settings['showShipTrack'];

        // Define a unique value renderer and symbols
        const trackRenderer = {
          type: "simple",
          symbol: {
            color: "#990000",  // dark red
            type: "simple-line",
            style: "solid"
          },
        }

        const webmap = new WebMap({
          portalItem: {
            id: '8948a092c59e4749869acc693b68b3a7'
          }
        });

        const view = new MapView({
          container: 'ship-location-map',
          map: webmap,
        });

        const shipTracks = new FeatureLayer({
            portalItem: {  // autocasts as esri/portal/PortalItem
              id: '6d4cf4d625e74c35b82fbed71166be50',
            },
            renderer: trackRenderer,
            opacity: 0.75
        });

        const fullscreen = new Fullscreen({
          view: view,
        });
        view.ui.add(fullscreen, "top-right");

        async function centerOnShip(webmap, view) {
            vehiclePositionsLayer = webmap.layers.find(({id}) => /^vehicle_positions/.test(id));
            const {extent} = await vehiclePositionsLayer.queryExtent();
            await view.goTo(extent);
            view.zoom = DEFAULT_ZOOM;
            if (userHasInteracted) {return;}
            recenterTimeout = setTimeout(centerOnShip, RECENTER_INTERVAL, webmap, view);
        }

        async function startUp() {
            await webmap.load();
            setViewFocus();

            const cruise = (await vehiclePositionsLayer.queryFeatures())?.features?.[0]?.attributes?.cruise;
            shipTracks.definitionExpression = `vehicle = 'Nautilus' AND cruise = '${cruise}'`;
            shipTracks.refreshInterval = 5; // Refresh every 5 minutes 
            console.log(`Cruise: ${cruise}`);

            if (showShipTrack) {
              await shipTracks.load();
              webmap.add(shipTracks);            
            }
        }

        async function setViewFocus() {
            await centerOnShip(webmap, view);

            await reactiveUtils.whenOnce(() => view.interacting || view.zoom != DEFAULT_ZOOM);
            userHasInteracted = true;
            clearTimeout(recenterTimeout);
        }

        startUp();
        
    }
  };
})(jQuery, Drupal);