wwt.controllers.controller(
  'StarHuntThumbsController',
  [
    '$scope',
    '$rootScope',
    'ThumbList',

    function ($scope, $rootScope, thumbList) {
      // A dumb, fake Place workalike for our custom app

      var STRETCH_LINEAR = 0,
          STRETCH_LOG = 1,
          STRETCH_POWER = 2,
          STRETCH_SQRT = 3,
          STRETCH_HISTEQ = 4;

      function StarHuntItem(name, fits_url, source_ra_deg, source_dec_deg, custom_scale, Source_Type) {
        var item = Object.create(StarHuntItem.prototype);
        item._name = name;
        item._fits_url = fits_url;
        item._fits_layer = null;
        item._source_ra_deg = source_ra_deg;
        item._source_dec_deg = source_dec_deg;
        item._custom_scale = custom_scale;
        item._markers = [];
        item._Source_Type = Source_Type;

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
        if (this._Source_Type == 'IRDC') {
            return '//www.worldwidetelescope.org/wwtweb/thumbnail.aspx?name=400514625';
        }
        else {
              return 'starhunt_data/SOMA_thumbnail_96x45.png'; //trying to change the thumbnail for SOMA sources
        }
      }

      StarHuntItem.prototype.get_name = function () {
        return this._name;
      }

      StarHuntItem.prototype.custom_click_action = function () {
        // This function is called when the user clicks on the thumbnail for one
        // of the targets in the ribbon at the top of the screen.

        if (this._fits_layer == null) {
          // We need to start loading the FITS layer.
          var self = this;

          this._fits_layer = wwt.wc.loadFitsLayer(
            this._fits_url,
            this._name,
            true, // goto target
            function(layer) { // called when image is loaded
              layer.getFitsImage().transparentBlack = false;

              if ("stretch" in self._custom_scale)
                layer.setImageScalePhysical(
                  self._custom_scale.stretch,
                  self._custom_scale.vmin,
                  self._custom_scale.vmax
                );
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

      // Defining the set of targets.
      //
      // NOTE: keep this list synchronized with `download-contextual-imagery.py`!

      var starhunt_items = [
        //IRDC sources
        //new StarHuntItem("G18.82-00.28", "starhunt_data/IRDC/A_J2000_msd_header_crop.fits",
        //                 276.58756512446, -12.629856445751,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G19.27+00.07", "starhunt_data/IRDC/B_J2000_msd_header_crop.fits",
        //                 276.48015568544, -12.085933420772,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G28.37+00.07", "starhunt_data/IRDC/C_J2000_msd_header_crop.fits",
        //                 280.70643669122, -4.0330137653732,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G28.53-00.25", "starhunt_data/IRDC/D_J2000_msd_header_crop.fits",
        //                 281.0843032635, -4.0038729282459,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G28.67+00.13", "starhunt_data/IRDC/E_J2000_msd_header_crop.fits",
        //                 280.80713427979, -3.7266555103755,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G34.43+00.24", "starhunt_data/IRDC/F_J2000_msd_header_crop.fits",
        //                 284.74722220156, 3.0861080163207,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G35.39-00.33", "starhunt_data/IRDC/H_J2000_msd_header_crop.fits",
        //                 284.28179957343, 2.1562146713294,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G38.95-00.47", "starhunt_data/IRDC/I_J2000_msd_header_crop.fits",
        //                 286.03264466695, 5.1534229243648,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G53.11+00.05", "starhunt_data/IRDC/J_J2000_msd_header_crop.fits",
        //                 292.32688673287, 17.931773261226,
        //                 {}, 'IRDC'),
        //new set of IRDC sources
        //new StarHuntItem("G023.60-00.09", "starhunt_data/IRDC/G023.60-0.009.fits",
        //                 278.581, -8.31932,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G024.64+00.16", "starhunt_data/IRDC/G024.64+00.16.fits",
        //                 278.913, -7.29610,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G024.94-00.15", "starhunt_data/IRDC/G024.94-00.15.fits",
        //                 279.342, -7.16906,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G030.14-00.07", "starhunt_data/IRDC/G030.14-00.07.fits",
        //                 281.647, -2.51808,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G031.98+00.06", "starhunt_data/IRDC/G031.98+00.06.fits",
        //                 282.367, -0.81795,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G035.60-00.25", "starhunt_data/IRDC/G035.60-00.25.fits",
        //                 284.303, 2.26117,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G023.39-00.11", "starhunt_data/IRDC/G023.39-00.11.fits",
        //                 278.581, -8.53002,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G025.15-00.28", "starhunt_data/IRDC/G025.15-00.28.fits",
        //                 279.550, -7.04726,
        //                 {}, 'IRDC'),
        //new StarHuntItem("G34.77-00.55", "starhunt_data/IRDC/G_J2000_msd_header_crop.fits", //example cloud in the booklet
        //                 284.20198245893, 1.3556447623029, //move to the end to avoid teams using it
        //                 {}, 'IRDC'), //for large classes, it would be used
        //SOMA sources
        new StarHuntItem("AFGL4029", "starhunt_data/SOMA/AFGL4029_SOFIA37um.fits",
                         45.3844857, 60.4870907,
                         {stretch: STRETCH_LOG, vmin: -0.0001, vmax: 0.03}, 'SOMA'),
        new StarHuntItem("AFGL437", "starhunt_data/SOMA/AFGL437_SOFIA37um.fits",
                         46.8518494, 58.5135955,
                         {stretch: STRETCH_LOG, vmin: -0.0001, vmax: 0.022}, 'SOMA'),
        new StarHuntItem("CepA", "starhunt_data/SOMA/CepA_SOFIA37um.fits",
                         344.079787, 62.032562,
                         {stretch: STRETCH_LOG, vmin: -0.0004, vmax: 0.28}, 'SOMA'),
        new StarHuntItem("G305.20", "starhunt_data/SOMA/G305.20_SOFIA37uma.fits",
                         197.793527, -62.577527,
                         {stretch: STRETCH_LOG, vmin: -64, vmax: 25000}, 'SOMA'),
        new StarHuntItem("G309.92", "starhunt_data/SOMA/G309.92_SOFIA37uma.fits",
                         207.67248, -61.58708,
                         {stretch: STRETCH_LOG, vmin: -88, vmax: 65000}, 'SOMA'),
        new StarHuntItem("G339.88", "starhunt_data/SOMA/G339.88_SOFIA37uma.fits",
                         253.01985, -46.14281,
                         {stretch: STRETCH_LOG, vmin: -30, vmax: 19000}, 'SOMA'),
        new StarHuntItem("G35.58", "starhunt_data/SOMA/G35.58_SOFIA37uma.fits",
                         284.094112, 2.341021,
                         {stretch: STRETCH_LOG, vmin: -29, vmax: 10700}, 'SOMA'),
        new StarHuntItem("G45", "starhunt_data/SOMA/G45_SOFIA37um.fits",
                         288.60687, 11.15752,
                         {stretch: STRETCH_LOG, vmin: -0.0002, vmax: 0.011}, 'SOMA'),
        new StarHuntItem("G45.12", "starhunt_data/SOMA/G45.12_SOFIA37uma.fits",
                         288.36611, 10.89366,
                         {stretch: STRETCH_LOG, vmin: -90, vmax: 55000}, 'SOMA'),
        new StarHuntItem("G49.27", "starhunt_data/SOMA/G49.27_SOFIA37uma.fits",
                         290.777863, 14.33655,
                         {stretch: STRETCH_LOG, vmin: -29, vmax: 1140}, 'SOMA'),
        //new StarHuntItem("IRAS07299", "starhunt_data/SOMA/IRAS07299_SOFIA37um.fits",
        //                 113.04036, -16.97001,
        //                 {stretch: STRETCH_LOG, vmin: -0.0004, vmax: 0.16}, 'SOMA'), // not very exciting source (to be changed!)
        new StarHuntItem("IRAS16562", "starhunt_data/SOMA/IRAS16562_SOFIA37uma.fits",
                         254.92355, -40.06229,
                         {stretch: STRETCH_LOG, vmin: -48, vmax: 29600}, 'SOMA'),
        //new StarHuntItem("IRAS20126", "starhunt_data/SOMA/IRAS20126_SOFIA37um.fits",
        //                 303.60879, 41.22569,
        //                 {stretch: STRETCH_LOG, vmin: -0.0002, vmax: 0.063}, 'SOMA'), //not very exciting source (to be changed!)
        new StarHuntItem("NGC7538", "starhunt_data/SOMA/NGC7538_SOFIA37um.fits",
                         348.50722, 61.45551,
                         {stretch: STRETCH_LOG, vmin: -0.00006, vmax: 0.048}, 'SOMA'),
        //new set of SOMA sources
        new StarHuntItem("G25.40", "starhunt_data/SOMA/G25.40_SOFIA_37.1um_cal_ast.fits",
                         279.5329235, -6.7666010,
                         {stretch: STRETCH_LOG, vmin: -0.01, vmax: 1.0}, 'SOMA'), //substitute IRAS07299
        new StarHuntItem("G33.91", "starhunt_data/SOMA/G33.91_SOFIA_37.1um_cal_ast.fits",
                         283.2098660, 0.9240782,
                         {stretch: STRETCH_LOG, vmin: -0.02, vmax: 1.0}, 'SOMA'), //substitute IRAS20126
        new StarHuntItem("G30.76", "starhunt_data/SOMA/G30.76_SOFIA_37.1um_cal_ast.fits",
                         281.6854982, -1.8421753,
                         {stretch: STRETCH_LOG, vmin: -0.03, vmax: 0.4}, 'SOMA'),
        new StarHuntItem("G58.77", "starhunt_data/SOMA/G58.77_SOFIA_37.1um_cal_ast.fits",
                         294.7025652, 23.1435937,
                         {stretch: STRETCH_LOG, vmin: -0.01, vmax: 0.3}, 'SOMA'),
        new StarHuntItem("IRAS20343", "starhunt_data/SOMA/IRAS20343_SOFIA_37.1um_cal_ast.fits",
                         309.0296629, 41.6639130,
                         {stretch: STRETCH_LOG, vmin: -0.01, vmax: 1.0}, 'SOMA'),
        new StarHuntItem("G35.2-0.74N", "starhunt_data/SOMA/G35_SOFIA37um.fits", //example sOMA in the booklet
                         284.554377, 1.676893, //move to the end to avoid teams using it
                         {stretch: STRETCH_LOG, vmin: -0.0003, vmax: 0.01}, 'SOMA') //for large classes, it would be used
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
