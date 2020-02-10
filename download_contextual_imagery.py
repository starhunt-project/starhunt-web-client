#! /usr/bin/env python3

"""Download contextual survey imagery to show below our targets. This script
fetches FITS files. They can be processed into JPEG images and WTML files
using generate_bitmaps.py.

"""
import argparse
from astropy import units as u
from astroquery.skyview import SkyView
import os.path
import sys

# NOTE: make sure this is synchronized with StarHuntThumbsController.js
TARGETS = [
    # IRDC targets
    ('G18.82-00.28', 276.58756512446, -12.629856445751),
    ('G19.27+00.07', 276.48015568544, -12.085933420772),
    ('G28.37+00.07', 280.70643669122, -4.0330137653732),
    ('G28.53-00.25', 281.0843032635, -4.0038729282459),
    ('G28.67+00.13', 280.80713427979, -3.7266555103755),
    ('G34.43+00.24', 284.74722220156, 3.0861080163207),
    ('G34.77-00.55', 284.20198245893, 1.3556447623029),
    ('G35.39-00.33', 284.28179957343, 2.1562146713294),
    ('G38.95-00.47', 286.03264466695, 5.1534229243648),
    ('G53.11+00.05', 292.32688673287, 17.931773261226),

    # SOMA targets
    ('AFGL4029', 45.3844857, 60.4870907),
    ('AFGL437', 46.8518494, 58.5135955),
    ('CepA', 344.079787, 62.032562),
    ('G305.20', 197.793527, -62.577527),
    ('G309.92', 207.67248, -61.58708),
    ('G339.88', 253.01985, -46.14281),
    ('G35.2-0.74N', 284.554377, 1.676893),
    ('G35.58', 284.094112, 2.341021),
    ('G45', 288.60687, 11.15752),
    ('G45.12', 288.36611, 10.89366),
    ('G49.27', 290.777863, 14.33655),
    ('IRAS07299', 113.04036, -16.97001),
    ('IRAS16562', 254.92355, -40.06229),
    ('IRAS20126', 303.60879, 41.22569),
    ('NGC7538', 348.50722, 61.45551),
]

def main():
    ap = argparse.ArgumentParser(
        description = 'Get contextual imagery'
    )
    ap.add_argument(
        '--size',
        type = float,
        default = 1000.,
        help = 'The size of the images to fetch, in arcseconds.'
    )
    ap.add_argument(
        'surveys',
        help = 'Comma-separated list of surveys to query.'
    )
    ap.add_argument(
        'outdir',
        help = 'The directory in which to save the downloaded FITS files.'
    )

    settings = ap.parse_args()
    surveys = settings.surveys.split(',')

    sv = SkyView()

    for name, ra_deg, dec_deg in TARGETS:
        for survey in surveys:
            print(name, survey, '...')

            hdulists = sv.get_images(
                position = f'{ra_deg} {dec_deg}',
                survey = survey,
                projection = 'Tan',
                width = settings.size * u.arcsec,
                height = settings.size * u.arcsec,
                #pixels = 300 # which produces JPEG images of 40 KB
                #pixels = 1000 # which produces JPEG images of 300 KB
                pixels = 2000 #which produces JPEG images of 300 KB to 1.2 MB depending on the richness of the region
            )

            if len(hdulists) == 0:
                print(f'warning: no images for {name}', file=sys.stderr)
                continue

            if len(hdulists) > 1:
                print(f'warning: multiple images for {name}', file=sys.stderr)

            hdulists[0].writeto(os.path.join(settings.outdir, f'{name}_{survey}.fits'))


if __name__ == '__main__':
    main()
