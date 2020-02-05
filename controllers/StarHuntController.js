wwt.controllers.controller(
  'StarHuntController',
  [
    '$scope',
    '$rootScope',

    function ($scope, $rootScope) {
      // See controllers/tabs/StarHuntThumbsController.js for the definition
      // of the Item type.

      var current_item = null;

      $rootScope.starhunt_target_selected = function(item) {
        // Called when the user clicks on a target in the top ribbon.

        if (current_item == item) {
          return;  // Do nothing additional if already selected
        }

        current_item = item;
        update_opacity_for_new_target(item);
        update_circles_for_new_target(item);
      }

      // Utilities

      var D2R = Math.PI / 180.,
          R2D = 180. / Math.PI,
          D2H = 1. / 15;

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

      function update_opacity_for_new_target(item) {
        // Note: changing the $scope variable causes the HTML DOM element to
        // automagically update.
        if (item._fits_layer == null) {
          $scope.starhunt_cur_opacity = 100;
        } else {
          $scope.starhunt_cur_opacity = item._fits_layer.get_opacity() * 100;
        }
      }

      // The circles/radials overlay

      var NUM_CIRCLES = 10;
      var NUM_RADIALS = 12;  // => 30 degrees each

      var circle_annotations = null,
          radial_annotations = null;

      $scope.starhunt_cur_circlesize = 20;  // sync with index.html

      function maybe_create_circles(item) {
        if (circle_annotations != null) {
          return;
        }

        var i;
        circle_annotations = [];

        for (i = 0; i < NUM_CIRCLES; i++) {
          var c = wwt.wc.createCircle();
          c.set_id('starhuntcirc' + i);
          c.set_skyRelative(true);
          c.setCenter(0, -89); // yikes!

          if (i % 5 == 4) { // note, not `== 0`!
            c.set_lineColor('#ffffff');
          } else {
            c.set_lineColor('#009933');
          }

          wwt.wc.addAnnotation(c);
          circle_annotations.push(c);
        }

        radial_annotations = [];

        for (i = 0; i < NUM_RADIALS; i++) {
          var r = wwt.wc.createPolyLine(false);
          r.set_id('starhuntradial' + i);
          r.addPoint(0, -89);
          r.addPoint(0.01, -89.1);

          if (i == 0) {
            r.set_lineColor('#ff6666');
          } else {
            r.set_lineColor('#009933');
          }

          wwt.wc.addAnnotation(r);
          radial_annotations.push(r);
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
          var rad = arcsec_to_circle_radius((i + 1) * cur_size, current_item._source_dec_deg);
          circle_annotations[i].set_radius(rad);
        }

        update_radials(current_item);
      }

      function update_circles_for_new_target(item) {
        maybe_create_circles(item);

        var cur_size = parseFloat($scope.starhunt_cur_circlesize);
        var i;

        for (i = 0; i < circle_annotations.length; i++) {
          circle_annotations[i].setCenter(item._source_ra_deg, item._source_dec_deg);

          // We need to update the circle radii too due to the cos(dec) bug in
          // the WebGL engine -- see comments in arcsec_to_circle_radius().
          var rad = arcsec_to_circle_radius((i + 1) * cur_size, item._source_dec_deg);
          circle_annotations[i].set_radius(rad);
        }

        update_radials(item);
      }

      $scope.on_recenter_circles_click = function(event) {
        if (current_item == null) {
          return;
        }

        current_item._source_ra_deg = wwt.viewport.RA * 15;
        current_item._source_dec_deg = wwt.viewport.Dec;
        update_circles_for_new_target(current_item);
        update_radials(current_item);
      }

      function update_radials(item) {
        // Figure out which way is galactic North by a dumb conversion.

        var equ0_deg = [item._source_ra_deg, item._source_dec_deg];
        var gal0_deg = wwtlib.Coordinates.j2000toGalactic(equ0_deg[0], equ0_deg[1]);
        var gal1_deg = [gal0_deg[0], gal0_deg[1] + 0.01];
        var equ1_deg = wwtlib.Coordinates.galactictoJ2000(gal1_deg[0], gal1_deg[1]);
        var pa_rad = sphbear(
          equ0_deg[1] * D2R,
          equ0_deg[0] * D2R,
          equ1_deg[1] * D2R,
          equ1_deg[0] * D2R
        );
        var distance_rad = NUM_CIRCLES * parseFloat($scope.starhunt_cur_circlesize) / 206265;

        // No supported way to edit polyline points, but it's javascript, so just reach into
        // those SDK internals ...

        var i;
        var pa_offset = 2 * Math.PI / NUM_RADIALS;

        for (i = 0; i < NUM_RADIALS; i++) {
          var equ2_rad_rev = sphofs(equ0_deg[1] * D2R, equ0_deg[0] * D2R, distance_rad, pa_rad);
          radial_annotations[i]._points$1[0] = wwtlib.Coordinates.raDecTo3d(
            equ0_deg[0] * D2H,
            equ0_deg[1]
          );
          radial_annotations[i]._points$1[1] = wwtlib.Coordinates.raDecTo3d(
            equ2_rad_rev[1] * R2D * D2H,
            equ2_rad_rev[0] * R2D
          );
          radial_annotations[i].annotationDirty = true;

          pa_rad += pa_offset;
        }
      }

      // Distance readout control

      $scope.starhunt_cur_ctrdist = '';
      $scope.starhunt_cur_ctrpa = '';

      function on_viewport_changed(event, viewport) {
        if (!viewport.isDirty && !viewport.init) {
          return;
        }

        var dist = 0.0,
            pa = 0.0;

        if (current_item != null) {
          var lon_rad = viewport.RA * Math.PI / 12; // hours => radians
          var lat_rad = viewport.Dec * Math.PI / 180; // degrees => radians
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

        $scope.starhunt_cur_ctrdist = float_to_text(dist * 206265);
        $scope.starhunt_cur_ctrpa = float_to_text(pa * 180 / Math.PI);
      }

      // Markers

      var MARKER_SIZE_ARCSEC = 3;

      $scope.on_create_marker_click = function(event) {
        if (current_item == null) {
          return;
        }

        var m = wwt.wc.createCircle();
        m.set_id('starhunt_target' + current_item.get_name() + current_item._markers.length);
        m.set_skyRelative(true);
        m.set_fill(true);
        m.set_fillColor('#ffff99');
        var rad = arcsec_to_circle_radius(MARKER_SIZE_ARCSEC, wwt.viewport.Dec);
        m.set_radius(rad);
        m.setCenter(wwt.viewport.RA * 15, wwt.viewport.Dec); // XXXX
        wwt.wc.addAnnotation(m);
        current_item._markers.push(m);
      }

      // Final initialization

      $rootScope.$on('viewportchange', on_viewport_changed);

      // utilities

      function arcsec_to_circle_radius(arcsec, dec_deg) {
        // Here's something fun. The WebGL renderer draws circles at the wrong
        // size. The core code computes the rendered radius as the nominal one
        // in degrees / 44, and you can bet that there is absolutely zero
        // explanation about what the hell that number is. But it apparently
        // isn't quite right *and* needs a cos(dec) correction.

        return (arcsec / 3600) * 0.769 / Math.cos(dec_deg * D2R);
      }

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

      function sphofs(lat1, lon1, r, pa) {
        // from pwkit.astutil.sphofs.
        //
        // Offset from one location on the sphere to another.
        //
        // This function is given a start location, expressed as a latitude and
        // longitude, a distance to offset, and a direction to offset (expressed as a
        // bearing, AKA position angle). It uses these to compute a final location.
        // This function mirrors :func:`sphdist` and :func:`sphbear` such that::
        //
        //   # If:
        //   r = sphdist (lat1, lon1, lat2a, lon2a)
        //   pa = sphbear (lat1, lon1, lat2a, lon2a)
        //   lat2b, lon2b = sphofs (lat1, lon1, r, pa)
        //   # Then lat2b = lat2a and lon2b = lon2a
        //
        // Arguments are:
        //
        // lat1
        //   The latitude of the start location.
        // lon1
        //   The longitude of the start location.
        // r
        //   The distance to offset by.
        // pa
        //   The position angle (“PA” or bearing) to offset towards.
        //
        // Returns a pair ``(lat2, lon2)``. All arguments and the return values are
        // measured in radians. The arguments may be vectors. The PA sign convention
        // is astronomical, measuring orientation east from north.
        //
        // Note that the ordering of the arguments and return values maps to the
        // nonstandard ordering ``(Dec, RA)`` in equatorial coordinates. In a
        // spherical projection it maps to ``(Y, X)`` which may also be unexpected.
        //
        // The offset is computed naively as::
        //
        //   lat2 = lat1 + r * cos (pa)
        //   lon2 = lon1 + r * sin (pa) / cos (lat2)
        //
        // This will fail for large offsets. Error checking can be done in two ways.
        // If *tol* is not None, :func:`sphdist` is used to calculate the actual
        // distance between the two locations, and if the magnitude of the fractional
        // difference between that and *r* is larger than *tol*, :exc:`ValueError` is
        // raised. This will add an overhead to the computation that may be
        // significant if you're going to be calling this function a lot.

        lat2 = lat1 + r * Math.cos(pa);
        lon2 = lon1 + r * Math.sin(pa) / Math.cos(lat2);
        return [lat2, lon2];
      }
    }
  ]
);
