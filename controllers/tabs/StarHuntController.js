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
        new StarHuntItem("Source A", "/starhunt_data/A_J2000_msd_header_crop.fits",
                         276.58756512446, -12.629856445751),
        new StarHuntItem("Source B", "/starhunt_data/B_J2000_msd_header_crop.fits",
                         276.48015568544, -12.085933420772)
      ];

      // Image controls

      var current_item = null,
          circle_annotations = null,
          controls_initialized = false;

      var NUM_CIRCLES = 4;

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
          c.set_radius((i + 1) * cur_size / 3600.);
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
          circle_annotations[i].set_radius((i + 1) * cur_size / 3600);
        }
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

      $('body').append($('#researchMenu'));
      init_thumbnail_ui();
    }
  ]
);
