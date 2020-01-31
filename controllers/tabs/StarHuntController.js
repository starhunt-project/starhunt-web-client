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
      // A dumb, fake Place workalike for our custom app

      function StarHuntItem(name, fits_url, source_ra_deg, source_dec_deg) {
        var item = Object.create(StarHuntItem.prototype);
        item._name = name;
        item._fits_url = fits_url;
        item._fits_layer = null;
        item._source_ra_deg = source_ra_deg;
        item._source_dec_deg = source_dec_deg;

        // Place stuff
        item.thumb = null;
        item.contextMenuEvent = null;
        item.isFGImage = false;
        item.isSurvey = false;
        item.isPanorama = false;
        item.isEarth = false;
        item.imageSet = null;
        item.guid = null;
        return item;
      }

      StarHuntItem.prototype.get_thumbnailUrl = function () {
        // This is a nice generic stars-y image
        return '//www.worldwidetelescope.org/wwtweb/thumbnail.aspx?name=400514625';
      }

      StarHuntItem.prototype.get_name = function () {
        return this._name;
      }

      StarHuntItem.prototype.custom_click_action = function () {
        maybe_init_controls();

        if (this._fits_layer == null) {
          // We need to start loading the FITS layer.
          this._fits_layer = wwt.wc.loadFitsLayer(
            this._fits_url,
            this._name,
            true, // goto target
            function(layer) { // called when image is loaded
              layer.getFitsImage().transparentBlack = false;
            }
          );

          $("#starhunt-opacity").val(100);
        } else {
          // FITS layer loaded or loading. Steer the UI there.
          var fits = this._fits_layer.getFitsImage();

          if (fits != null) { // image may not have been loaded yet
            wwt.wc.gotoRaDecZoom(
              fits.get_centerX(),
              fits.get_centerY(),
              2 * fits.get_scaleY() * fits.get_sizeY(),
              false
            );
          }

          $("#starhunt-opacity").val(this._fits_layer.get_opacity() * 100);
        }

        current_item = this;

        // Update the circles to be centered correctly.

        var i;

        for (i = 0; i < circle_annotations.length; i++) {
          circle_annotations[i].setCenter(this._source_ra_deg, this._source_dec_deg);
        }
      }

      StarHuntItem.prototype.get_isFolder = function () {
        return false;
      }

      StarHuntItem.prototype.get_backgroundImageset = function () {
        return "ok";
      }

      StarHuntItem.prototype.get_studyImageset = function () {
        return null;
      }

      StarHuntItem.prototype.get_url = function () {
        return null;
      }

      StarHuntItem.prototype.get_tourUrl = function () {
        return null;
      }

      StarHuntItem.prototype.get_camParams = function () {
        return null;
      }

      // Defining the set of targets

      var starhunt_items = [
        new StarHuntItem("G18.82-00.28", "starhunt_data/A_J2000_msd_header_crop.fits",
                         276.58756512446, -12.629856445751),
        new StarHuntItem("G19.27+00.07", "starhunt_data/B_J2000_msd_header_crop.fits",
                         276.48015568544, -12.085933420772),
        new StarHuntItem("G28.37+00.07", "starhunt_data/C_J2000_msd_header_crop.fits",
                         280.70643669122, -4.0330137653732),
        new StarHuntItem("G28.53-00.25", "starhunt_data/D_J2000_msd_header_crop.fits",
                         281.0843032635, -4.0038729282459),
        new StarHuntItem("G28.67+00.13", "starhunt_data/E_J2000_msd_header_crop.fits",
                         280.80713427979, -3.7266555103755),
        new StarHuntItem("G34.43+00.24", "starhunt_data/F_J2000_msd_header_crop.fits",
                         284.74722220156, 3.0861080163207),
        new StarHuntItem("G34.77-00.55", "starhunt_data/G_J2000_msd_header_crop.fits",
                         284.20198245893, 1.3556447623029),
        new StarHuntItem("G35.39-00.33", "starhunt_data/H_J2000_msd_header_crop.fits",
                         284.28179957343, 2.1562146713294),
        new StarHuntItem("G38.95-00.47", "starhunt_data/I_J2000_msd_header_crop.fits",
                         286.03264466695, 5.1534229243648),
        new StarHuntItem("G53.11+00.05", "starhunt_data/J_J2000_msd_header_crop.fits",
                         292.32688673287, 17.931773261226)
      ];

      // Image controls

      var current_item = null,
          circle_annotations = null,
          controls_initialized = false;

      var NUM_CIRCLES = 4;

      // Here's something fun. The WebGL renderer draws circles at the wrong
      // size. The core code computes the rendered radius as the nominal one
      // in degrees / 44, and you can bet that there is absolutely zero
      // explanation about what the hell that number is. Work around this.
      var CIRCLE_SIZE_CORRECTION_FACTOR = 0.786;

      function maybe_init_controls() {
        if (controls_initialized) {
          return;
        }

        var opacity_dom = $("#starhunt-opacity");
        // Need to watch the "input" event to get changes before mouse-up:
        opacity_dom.on('input change', function () { on_opacity_changed(opacity_dom) });

        var circlesize_dom = $("#starhunt-circlesize");
        circlesize_dom.on('input change', function () { on_circlesize_changed(circlesize_dom) });
        var cur_size = circlesize_dom.val();

        circle_annotations = [];
        var i;

        for (i = 0; i < NUM_CIRCLES; i++) {
          var c = wwt.wc.createCircle();
          c.set_id('starhuntcirc' + i);
          c.set_skyRelative(true);
          c.setCenter(0, 0); // yikes!
          c.set_radius((i + 1) * cur_size / 3600. * CIRCLE_SIZE_CORRECTION_FACTOR);
          wwt.wc.addAnnotation(c);
          circle_annotations.push(c);
        }

        controls_initialized = true;
      }

      function on_opacity_changed(opacity_dom) {
        if (current_item == null) {
          return;
        }

        if (current_item._fits_layer == null) {
          return;
        }

        current_item._fits_layer.set_opacity(0.01 * opacity_dom.val());
      }

      function on_circlesize_changed(circlesize_dom) {
        if (circle_annotations == null) {
          return;
        }

        var cur_size = circlesize_dom.val();
        var i;

        for (i = 0; i < circle_annotations.length; i++) {
          circle_annotations[i].set_radius((i + 1) * cur_size / 3600 * CIRCLE_SIZE_CORRECTION_FACTOR);
        }
      }

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

      // Thumbnail list UI logic

      var depth = 1,
          bc,
          cache = [],
          openCollection,
	  newCollectionUrl;

      var calcPageSize = function () {
	thumbList.calcPageSize($scope, false);
      };

      $scope.clickThumb = function (item) {
	var cur_params = {
	  breadCrumb: bc,
          depth: depth,
	  cache: cache,
	  openCollection: openCollection,
	  newCollectionUrl: newCollectionUrl
	};

	var new_params = thumbList.clickThumb(item, $scope, cur_params, null);

	bc = new_params.breadCrumb;
	cache = new_params.cache;
	openCollection = new_params.openCollection;
	newCollectionUrl = new_params.newCollectionUrl;
	depth = new_params.depth;
      };

      $scope.expanded = false;

      $(window).on('resize', function () {
	$scope.currentPage = 0;
	calcPageSize();
      });

      function init_thumbnail_ui() {
	thumbList.init($scope, 'starhunt');
	$scope.collection = starhunt_items;
	$scope.breadCrumb = bc = ['Targets'];
	cache = [$scope.collection];
	calcPageSize();
      }

      // Final initialization

      $rootScope.cur_circlesize = 20; // keep synced with index.html
      $rootScope.starhunt_cur_ctrdist = '';
      $rootScope.starhunt_cur_ctrpa = '';

      $('body').append($('#researchMenu'));
      init_thumbnail_ui();

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
