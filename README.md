# The StarHunt web client

[![Build Status](https://dev.azure.com/starhunt-project/starhunt-infra/_apis/build/status/starhunt-project.starhunt-web-client?branchName=master)](https://dev.azure.com/starhunt-project/starhunt-infra/_build/latest?definitionId=1&branchName=master)

This repository contains a forked version of the [AAS WorldWide Telescope]
(WWT) [web client] intended for use in the StarHunt project spearheaded by
[Jonathan Tan] at [Chalmers University]. See
[worldwidetelescope/wwt-web-client] for details about the upstream project.

[AAS WorldWide Telescope]: http://worldwidetelescope.org/
[web client]: http://worldwidetelescope.org/webclient
[Jonathan Tan]: https://www.chalmers.se/en/staff/Pages/jonathan-tan.aspx
[Chalmers University]: https://www.chalmers.se/en/departments/see/research/Astronomy-and-Plasma-Physics/Pages/default.aspx
[worldwidetelescope/wwt-web-client]: https://github.com/worldwidetelescope/wwt-web-client/

The StarHunt web client currently runs at:

### http://chalmersstarhunt.z13.web.core.windows.net/


## Building and Testing

In order to build and test the website, you need:

1. [Node.js](https://nodejs.org/), specifically the `npm` command. If you need
   to install Node.js, use your operating system’s package manager or visit
   [nodejs.org](https://nodejs.org/) for installation instructions.
2. The [Grunt](https://gruntjs.com/) task runner, specifically the `grunt`
   command. Once again, install it using your operating system’s package
   manager or [see the Grunt website](https://gruntjs.com/getting-started).

The first time you check out these files, run:

```
npm install
```

Once that has been done, you can build the website with:

```
grunt dist-all
```

To test the website locally, you need to download the project’s FITS data
files and place them in the directory `starhunt_data/`. Then, we recommend
running:

```
npx http-server -p 8888 dist/
```

You can then visit the URL <http://localhost:8888/> to test out the web
app in your browser.


## Legalities

This code code is licensed under the [MIT License]. The copyright to the
original WWT code is owned by the [.NET Foundation].

[MIT License]: https://opensource.org/licenses/MIT

## AAS WorldWide Telescope Acknowledgment

The AAS WorldWide Telescope system is a [.NET Foundation] project. Work on WWT
has been supported by the [American Astronomical Society] (AAS), the US
[National Science Foundation] (grants [1550701] and [1642446]), the
[Gordon and Betty Moore Foundation], and [Microsoft]. Established in 1899 and
based in Washington, DC, the AAS is the major organization of professional
astronomers in North America.

[American Astronomical Society]: https://aas.org/
[.NET Foundation]: https://dotnetfoundation.org/
[National Science Foundation]: https://www.nsf.gov/
[1550701]: https://www.nsf.gov/awardsearch/showAward?AWD_ID=1550701
[1642446]: https://www.nsf.gov/awardsearch/showAward?AWD_ID=1642446
[Gordon and Betty Moore Foundation]: https://www.moore.org/
[Microsoft]: https://www.microsoft.com/
