wwt.controllers.controller(
  'StarHuntController',
  [
    '$scope',
    '$rootScope',
    'AppState',
    'Places',
    '$timeout',
    'Util',
    'ThumbList',
    'UILibrary',

    function ($scope, $rootScope, appState, places, $timeout, util, thumbList, uiLib) {
      // See controllers/tabs/StarHuntThumbsController.js for the definition
      // of the Item type.

      var current_item = null,
          controls_initialized = false;

      $rootScope.starhunt_target_selected = function(item) {
        // Called when the user clicks on a target in the top ribbon.

        if (current_item == item) {
          return;  // Do nothing additional if already selected
        }

        current_item = item;

        maybe_create_circles();

        // Update the opacity readout.

        if (item._fits_layer == null) {
          $scope.starhunt_cur_opacity = 100;
          //$("#starhunt-opacity").val(100);
        } else {
          $scope.starhunt_cur_opacity = item._fits_layer.get_opacity() * 100;
          //$("#starhunt-opacity").val(item._fits_layer.get_opacity() * 100);
        }

        // Update the circles to be centered correctly.

        var i;

        for (i = 0; i < circle_annotations.length; i++) {
          circle_annotations[i].setCenter(item._source_ra_deg, item._source_dec_deg);
        }
      }

      // Opacity control

      $scope.starhunt_cur_opacity = 100;  // sync with index.html

      $scope.on_opacity_changed = function() {
        if (current_item == null) {
          return;
        }

        if (current_item._fits_layer == null) {
          return;
        }

        current_item._fits_layer.set_opacity(0.01 * $scope.starhunt_cur_opacity);
      }

      // Circle size control
      //
      // Here's something fun. The WebGL renderer draws circles at the wrong
      // size. The core code computes the rendered radius as the nominal one
      // in degrees / 44, and you can bet that there is absolutely zero
      // explanation about what the hell that number is. Work around this.
      var CIRCLE_SIZE_CORRECTION_FACTOR = 0.786;
      var NUM_CIRCLES = 4;

      var circle_annotations = null;

      $scope.starhunt_cur_circlesize = 20;  // sync with index.html

      function maybe_create_circles() {
        if (circle_annotations != null) {
          return;
        }

        circle_annotations = [];
        var i;

        for (i = 0; i < NUM_CIRCLES; i++) {
          var c = wwt.wc.createCircle();
          c.set_id('starhuntcirc' + i);
          c.set_skyRelative(true);
          c.setCenter(0, -89); // yikes!
          wwt.wc.addAnnotation(c);
          circle_annotations.push(c);
        }

        $scope.on_circlesize_changed();
      }

      $scope.on_circlesize_changed = function() {
        if (circle_annotations == null) {
          return;
        }

        var cur_size = parseFloat($scope.starhunt_cur_circlesize);
        var i;

        for (i = 0; i < circle_annotations.length; i++) {
          circle_annotations[i].set_radius((i + 1) * cur_size / 3600 * CIRCLE_SIZE_CORRECTION_FACTOR);
        }
      }

      // Distance readout control

      function on_viewport_changed(event, viewport) {
        if (!viewport.isDirty && !viewport.init) {
          return;
        }

        var dist = 0.0,
            pa = 0.0;

        if (current_item != null) {
          var lon_rad = viewport.RA * Math.PI / 12; // this is in hours
          var lat_rad = viewport.Dec * Math.PI / 180; // this is in degrees
          dist = sphdist(
            current_item._source_dec_deg * Math.PI / 180,
            current_item._source_ra_deg * Math.PI / 180,
            lat_rad,
            lon_rad
          );
          pa = sphbear(
            current_item._source_dec_deg * Math.PI / 180,
            current_item._source_ra_deg * Math.PI / 180,
            lat_rad,
            lon_rad
          );
        }

        $rootScope.starhunt_cur_ctrdist = float_to_text(dist * 206265);
        $rootScope.starhunt_cur_ctrpa = float_to_text(pa * 180 / Math.PI);
      }

      // Markers

      $scope.on_create_marker_click = function(event) {
        console.log("marker click");
      }

      // Final initialization

      $rootScope.starhunt_cur_ctrdist = '';
      $rootScope.starhunt_cur_ctrpa = '';
      $rootScope.$on('viewportchange', on_viewport_changed);

      // utilities

      function float_to_text(v) {
        if (v > 999) {
          return '>999';
        }

        if (v < -999) {
          return '<-999';
        }

        var av = Math.abs(v);

        if (av < 0.1) {
          return '0';
        }

        if (av < 10) {
          return '' + v.toFixed(1);
        }

        return '' + v.toFixed(0);
      }

      function sphdist(lat1, lon1, lat2, lon2) {
        // from pwkit.astutil.sphdist; "specialized Vincenty formula"
        var cd = Math.cos(lon2 - lon1);
        var sd = Math.sin(lon2 - lon1);
        var c2 = Math.cos(lat2);
        var c1 = Math.cos(lat1);
        var s2 = Math.sin(lat2);
        var s1 = Math.sin(lat1);
        var a = Math.hypot(c2 * sd, c1 * s2 - s1 * c2 * cd);
        var b = s1 * s2 + c1 * c2 * cd;
        return Math.atan2(a, b);
      }

      function sphbear(lat1, lon1, lat2, lon2) {
        // from pwkit.astutil.sphbear.
        //
        // Calculate the bearing between two locations on a sphere.
        //
        // lat1
        //   The latitude of the first location.
        // lon1
        //   The longitude of the first location.
        // lat2
        //   The latitude of the second location.
        // lon2
        //   The longitude of the second location.
        //
        // The bearing (AKA the position angle, PA) is the orientation of
        // point 2 with regards to point 1 relative to the longitudinal axis.
        // Returns the bearing in radians. All arguments are in radians as
        // well.
        //
        // Note that the ordering of the arguments maps to the nonstandard
        // ordering ``(Dec, RA)`` in equatorial coordinates. In a spherical
        // projection it maps to ``(Y, X)`` which may also be unexpected.
        //
        // The sign convention is astronomical: bearings range from -π to π,
        // with negative values if point 2 is in the western hemisphere with
        // regards to point 1, positive if it is in the eastern. (That is,
        // “east from north”.) If point 1 is very near the pole, the bearing
        // is undefined and the result is NaN.
        //
        // Derived from ``bear()`` in `angles.py from Prasanth Nair
        // <https://github.com/phn/angles>`_. His version is BSD licensed.
        // This one is sufficiently different that I think it counts as a
        // separate implementation. [This version is then derived in turn from
        // pwkit.]

        var v1 = wwtlib.Vector3d.create(
          Math.cos(lat1) * Math.cos(lon1),
          Math.cos(lat1) * Math.sin(lon1),
          Math.sin(lat1)
        );

        var v2 = wwtlib.Vector3d.create(
          Math.cos(lat2) * Math.cos(lon2),
          Math.cos(lat2) * Math.sin(lon2),
          Math.sin(lat2)
        );

        if (Math.hypot(v1.x, v2.x) < 1e-4) {
          return 0.0; // near a pole; don't bother
        }

        var p12 = wwtlib.Vector3d.cross(v1, v2);  // ~"perpendicular to great circle containing points"
        var p1z = wwtlib.Vector3d.create(  // ~"perp to base and Z axis"
          v1.y,
          -v1.x,
          0
        );
        var cm = wwtlib.Vector3d.getLength(wwtlib.Vector3d.cross(p12, p1z));  // ~"angle between the vectors"
        var bearing = Math.atan2(cm, wwtlib.Vector3d.dot(p12, p1z));

        if (p12.z < 0) {  // convert to [-pi/2, pi/2]
          bearing = -bearing;
        }

        return bearing;
      }
    }
  ]
);
