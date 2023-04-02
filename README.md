## Summary

This script reads JSON files as returned by the NMS API, then converts that data
into CSV files.

## Prerequisites

- [Deno](https://deno.land/manual@v1.32.3/getting_started/installation)

## Usage

The JSON files should be in subfolders of the `data` folder (you need to create
it next to the `main.js` file if it isn't present). This Script is intended to
analyse multiple regions simultaneously. Each region will have its own output
csv, and there will also be one global csv. The regions are represented by the
folders in `data`.

CLI command to run:

```
deno run --allow-read --allow-write main.js
```

### Additional Arguments
You can also specify a filename for the combined region csv, like this:
```
deno run --allow-read --allow-write main.js RegionData
```
This will result in `RegionData.csv` being created instead of the default `AllRegions.csv`.