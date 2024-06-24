import WebMap from "@arcgis/core/WebMap.js";
import Basemap from "@arcgis/core/Basemap.js";
import MapView from "@arcgis/core/views/MapView.js";
import Fullscreen from "@arcgis/core/widgets/Fullscreen.js";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";

(function ($, Drupal) {
  Drupal.behaviors.shipLocation = { 
    attach: function(context, settings) {

      //console.log(settings);

      const DEFAULT_ZOOM = 8;
      const REFRESH_INTERVAL_MINUTES = 5;
      // Recenter on ship approximatly every 5 minutes.
      // * "Approximately" because the centerOnShip function awaits some Promises before actually
      // recentering the map so it may be a bit longer than 5 minutes.
      const RECENTER_INTERVAL_MILLISECONDS = REFRESH_INTERVAL_MINUTES * 60 * 1000;  
      const SHIP_TRACKS_PORTAL_ITEM_ID = '91fdc3cc7cb646ddac85367fc38eee7d';
      const SHOW_SHIP_TRACK = settings['showShipTrack']; // setting from Drupal block;

      let recenterTimeout;
      let userHasInteracted;
      
      const nautilusLayer =  new MapImageLayer({
          portalItem: {
              id: '418c6f44f4f5442784852f670a936cff',
          },
          sublayers: [
              {
                  id: 0,
                  definitionExpression: "vehicle = 'Nautilus'",
                  renderer: {
                      symbol: {
                          angle: 180,
                          height: 19,
                          type: 'picture-marker',
                          // TODO: would prefer to host and use an actual PNG file rather than a data-url
                          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB5CAYAAADyOOV3AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAADKGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMwMTQgNzkuMTU2Nzk3LCAyMDE0LzA4LzIwLTA5OjUzOjAyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxNCAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDozQjM4OTdDQzZDNDkxMUU0QTM3RThDNzNCRDk3QTcyQSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDozQjg2NjYzQzZDNDkxMUU0QTM3RThDNzNCRDk3QTcyQSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjNCMzg5N0NBNkM0OTExRTRBMzdFOEM3M0JEOTdBNzJBIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjNCMzg5N0NCNkM0OTExRTRBMzdFOEM3M0JEOTdBNzJBIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+hoE5twAABI9JREFUeF7t3d1tW1cQRWGX4BJSQkpICS4hpaQDl5BSXEJKcAkuQT4jUMbN9qLEn3u5OAdngA8GNiSSe+bhynrRp5eXl2ViGC7zwHCZB4bLPDBc5oHhMg8Ml3lguMwDw2UeGC7zwHCZB4bLPDBc5oGh5c75PPw1/DP8O3wbfgz1wh+pr6uvr++r76/Xqde7eaifAUPLDfPn8HX4b9gebC/1uvX69T5XDfUzYGi5Yv4ejjrqOfV+9b4XDfUzYGi5YGrB34ft4h+t3v/DQ1M/A4aWd6aeh/WM3C7aVp/n7HOa+hkwtJyZev5d+sPSo9Xnwucz9TNgaIF55uO+wSNTPwOGlpgOx33z25GpnwFDy2bq2Wb/MHWt+ry/nsnUz4ChZTP1f8/t8rqoz/061M+AoeU0fwzbpXVTnx/7GTC0nKZ+XbhdWDf1+bGfAUPLmHqGdfnB6pz6/J+pnwFDy5gvpyV194X6GTC0jOn6w1X6Sv0MGFrGPNuvI2/1jfoZMLTEklrLbhYMLbmkzrKbBUNLLqmz7GbB0JJL6iy7WTC05JI6y24WDC25pM6ymwVDSy6ps+xmwdCSS+osu1kwtOSSOstuFgwtuaTOspsFQ0suqbPsZsHQkkvqLLtZMLTkkjrLbhYMLbmkzrKbBUNLLqmz7GbB0JJL6iy7WTC05JI6y24WDC25pM6ymwVDSy6ps+xmwdCSS+osu1kwtOSSOstuFgwtuaTOspsFQ0suqbPsZsHQkkvqLLtZMLTkkjrLbhYMLbmkzrKbBUNLLqmz7GbB0JJL6iy7WTC05JI6y24WDC25pM6ymwVDSy6ps+xmwdCSS+osu1kwtOSSOstuFgwtuaTOspsFQ0suqbPsZsHQkkvqLLtZMLTkkjrLbhYMLbmkzrKbBUNLLqmz7GbB0JJL6iy7WTC05JI6y24WDC25pM6ymwVDSy6ps+xmwdCSS+osu1kwtOSSOstuFgwtuaTOspsFQ0suqbPsZsHQkkvqLLtZMLTkkjrLbhYMLbmkzrKbBUNLLqmz7GbB0JJL6iy7WTC05JI6y24WDC25pM6ymwVDy5juf/XszQ/qZ8DQMqbT3ww+5/VvCVM/A4aW03Q+8utxB+xnwNCymY5H/nXcGupnwNAS0+nI/ztuDfUzYGiB6XDk345bQ/0MGFrOzDMfGY9bQ/0MGFremWc88tnj1lA/A4aWD+aZjvzucWuonwFDywXzDEf+8Lg11M+AoeXCMY980XFrqJ8BQ8sVYxz54uPWUD8DhpYr55FHvuq4NdTPgKHlhnnEka8+bg31M2BouXGOPPJNx62hfgYMLXfMEUe++bg11M+AoeXO2fPIdx23hvoZMLTsMHsc+e7j1lA/A4aWneaeI+9y3BrqZ8DQsuPccuTdjltD/QwYWnaea46863FrqJ8BQ8sBc8mRdz9uDfUzYGg5aN478iHHraF+BgwtBw4d+bDj1lA/A4aWg2d75EOPW0P9DBhaHjB11O+nfw8d6mfAcJkHhss8MFzmgeEyDwyXeWC4zAPDZR4YLvPAcJkHhss8MFzmgeEyi5dPPwH1LUNJwiLsKwAAAABJRU5ErkJggg==',
                          width: 19,
                          xoffset: 0,
                          yoffset: 0
                      },
                      type: 'simple',
                      visualVariables: [
                          {
                              field: 'heading', 
                              rotationType: 'geographic',
                              type: 'rotation',
                          },
                      ],
                  },
              },
          ],
      });
      const layers = [];
      if (SHOW_SHIP_TRACK) {
          const shipTrackLayer = new MapImageLayer({
              portalItem: {
                  id: SHIP_TRACKS_PORTAL_ITEM_ID,
              },
              sublayers: [
                  {
                      id: 0, 
                      renderer: {
                          symbol: {
                              color: '#990000', // dark red
                              style: 'solid',
                              type: 'simple-line',
                          },
                          type: 'simple',
                      },
                  },
              ],
          });
          layers.push(shipTrackLayer);
      }
      layers.push(nautilusLayer);

      const webmap = new WebMap({
          basemap: Basemap.fromId('oceans'),
          layers,
      });

      const vehiclePositionsLayer = new FeatureLayer({
          portalItem: {
              id: '871f7733569c437f9eeebf94d72cb6bc',
          },
      });
      const query = vehiclePositionsLayer.createQuery();
      query.where = "vehicle = 'Nautilus'";

      const view = new MapView({
          container: 'ship-location-map-container',
          map: webmap,
      });

      const fullscreen = new Fullscreen({
        view: view,
      });
      view.ui.add(fullscreen, "top-right");

      async function centerOnShip() {
          const {extent} = await vehiclePositionsLayer.queryExtent(query);
          extent.zoom = DEFAULT_ZOOM;
          await view.goTo(extent);
          if (userHasInteracted) {return;}
          recenterTimeout = setTimeout(centerOnShip, RECENTER_INTERVAL_MILLISECONDS, webmap, view);
      }

      async function startUp() {                    
          await webmap.load();

          setViewFocus();
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