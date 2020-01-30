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
      // A dumb, fake Place workalike for our custom

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

      // Actual UI logic

      var depth = 1,
          bc,
          cache = [],
          openCollection,
	  newCollectionUrl;

      $scope.initStarHuntView = function () {
	thumbList.init($scope, 'starhunt');

	$('body').append($('#researchMenu'));

	$scope.collection = [
          new StarHuntItem("Source A", "/starhunt_data/A_J2000_msd_header_crop.fits"),
          new StarHuntItem("Source B", "/starhunt_data/B_J2000_msd_header_crop.fits")
        ];

	$scope.breadCrumb = bc = ['Targets'];

	cache = [$scope.collection];
	calcPageSize();
      };

      var calcPageSize = function () {
	thumbList.calcPageSize($scope, false);
      };

      $scope.clickThumb = function (item) {
	var out_params = {
	  breadCrumb: bc,
          depth: depth,
	  cache: cache,
	  openCollection: openCollection,
	  newCollectionUrl: newCollectionUrl
	};

	var new_params = thumbList.clickThumb(item, $scope, out_params, null);
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

      $scope.initStarHuntView();
    }
  ]
);
