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

      function StarHuntItem(name, fits_url) {
        var item = Object.create(StarHuntItem.prototype);
        item._name = name;
        item._fits_url = fits_url;
        item._fits_layer = null;

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
        return '//www.worldwidetelescope.org/wwtweb/thumbnail.aspx?name=folder';
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
        new StarHuntItem("Source A", "/starhunt_data/A_J2000_msd_header_crop.fits"),
        new StarHuntItem("Source B", "/starhunt_data/B_J2000_msd_header_crop.fits")
      ];

      // Image controls

      var current_item = null,
          controls_initialized = false;

      function maybe_init_controls() {
        if (controls_initialized) {
          return;
        }

        var opacity_dom = $("#starhunt-opacity");
        // Need to watch the "input" event to get changes before mouse-up:
        opacity_dom.on('input change', function () { on_opacity_changed(opacity_dom) });

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
