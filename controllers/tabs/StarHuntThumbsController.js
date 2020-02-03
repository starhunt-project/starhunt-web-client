wwt.controllers.controller(
  'StarHuntThumbsController',
  [
    '$scope',
    '$rootScope',
    'ThumbList',

    function ($scope, $rootScope, thumbList) {
      // A dumb, fake Place workalike for our custom app

      function StarHuntItem(name, fits_url, source_ra_deg, source_dec_deg) {
        var item = Object.create(StarHuntItem.prototype);
        item._name = name;
        item._fits_url = fits_url;
        item._fits_layer = null;
        item._source_ra_deg = source_ra_deg;
        item._source_dec_deg = source_dec_deg;
        item._markers = [];

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
        // This function is called when the user clicks on the thumbnail for one
        // of the targets in the ribbon at the top of the screen.

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

        $rootScope.starhunt_target_selected(this);
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
                         292.32688673287, 17.931773261226),
        new StarHuntItem("G35.2-0.74N", "starhunt_data/SOMA/G35_SOFIA37um.fits",
                         284.554377, 1.676893)
      ];

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

      // Final initialization

      $('body').append($('#researchMenu'));
      thumbList.init($scope, 'starhunt');
      $scope.collection = starhunt_items;
      $scope.breadCrumb = bc = ['Targets'];
      cache = [$scope.collection];
      calcPageSize();
    }
  ]
);
