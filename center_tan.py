#! /usr/bin/env python
# Copyright 2020 Peter Williams
# Licensed under the MIT License.

"""Reproject an image to a TAN coordinate system with the CRPIX in the middle
of the image.

Command-line usage:

./center_tan.py infile.fits outfile.fits

Requires the Python modules `astropy` and `reproject`.

The full image is loaded into memory so this won't work with huge FITS files.

"""
from astropy.io import fits
from astropy.wcs import WCS
import numpy as np
from reproject import reproject_interp
from reproject.mosaicking import find_optimal_celestial_wcs
import sys

def main():
    in_path, out_path = sys.argv[1:]

    in_hdul = fits.open(in_path)
    in_hdu = in_hdul[0]
    in_wcs = WCS(in_hdu)
    in_center = in_wcs.pixel_to_world(in_hdu.shape[1] / 2, in_hdu.shape[0] / 2)

    out_wcs, out_shape = find_optimal_celestial_wcs(
        [in_hdu],
        frame = 'icrs',
        auto_rotate = True,
        reference = in_center,
    )

    out_data = reproject_interp(
        in_hdu, out_wcs,
        shape_out = out_shape,
        return_footprint = False,
    )
    out_data = out_data.astype(np.float32)

    fits.writeto(out_path, out_data, out_wcs.to_header(), overwrite=True)


if __name__ == '__main__':
    main()
