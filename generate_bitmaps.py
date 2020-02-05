#! /usr/bin/env python3

"""Given a bunch of downloaded FITS images, combine them to emit JPEG images
and WTML files that can be view in WWT.

"""

import argparse
from astropy.io import fits
from astropy.visualization import AsymmetricPercentileInterval
from astropy.wcs import WCS
import numpy as np
import os.path
from PIL import Image
import sys
from wwt_data_formats import write_xml_doc
from wwt_data_formats.imageset import ImageSet
from wwt_data_formats.folder import Folder

# Hack to share data between the scripts
from download_contextual_imagery import TARGETS

def main():
    ap = argparse.ArgumentParser(
        description = 'Generate bitmap images'
    )
    ap.add_argument(
        'indir',
        help = 'The directory with the downloaded FITS files.'
    )
    ap.add_argument(
        'outdir',
        help = 'The directory in which to save the JPEG and WTML files.'
    )

    settings = ap.parse_args()

    # Scan the input directory

    all_surveys = set()
    sources = {}

    for basename in os.listdir(settings.indir):
        source, survey = basename.replace('.fits', '').split('_', 1)
        survey_to_path = sources.setdefault(source, {})
        survey_to_path[survey] = os.path.join(settings.indir, basename)
        all_surveys.add(survey)

    if '2MASS-J' in all_surveys:
        all_surveys = ['2MASS-J', '2MASS-H', '2MASS-K']
        merge_name = '2MASS'
    else:
        all_surveys = sorted(all_surveys)  # default
        merge_name = all_surveys[0]

    # Process away using our dumb algorithm

    folder = Folder()

    for source, survey_to_path in sources.items():
        inputs = [survey_to_path.get(s) for s in all_surveys]
        imgbase = f'{source}-{merge_name}.jpg'

        template_path = inputs[0]  # NB. we could make fewer assumptions here
        hdulist = fits.open(template_path)
        template_hdu = hdulist[0]
        shape = template_hdu.shape

        imgset = ImageSet()
        imgset.set_position_from_wcs(template_hdu.header, shape[1], shape[0])
        imgset.credits = 'Omitted! Shame!'
        imgset.data_set_type = 'Sky'
        imgset.description = f'{source} in {merge_name}'
        imgset.file_type = '.jpg'
        imgset.name = f'StarHunt-Context-{source}-{merge_name}'
        imgset.url = os.path.join(settings.outdir, imgbase)  # XXX not necessarily the right assumption
        folder.children.append(imgset)

        buffer = np.zeros(shape + (3,))

        # Load the images. For 2MASS, it turns out that we should stretch
        # each channel independently, so that's what we do.

        stretch = AsymmetricPercentileInterval(0.5, 98)

        for idx, path in enumerate(inputs):
            if path is None:
                continue

            hdu = fits.open(path)[0]
            assert hdu.shape == shape
            buffer[::-1,...,idx] = stretch(hdu.data)  # flip vertically: FITS convention => bitmap

        buffer = (255 * buffer).astype(np.uint8)

        # Write out the results

        img = Image.fromarray(buffer)
        img.save(os.path.join(settings.outdir, imgbase))

    with open(os.path.join(settings.outdir, f'{merge_name}.wtml'), 'wt') as f:
        write_xml_doc(folder.to_xml(), dest_stream=f)


if __name__ == '__main__':
    main()
