## Summary

This script reads JSON files as returned by the NMS API, then converts that data
into CSV and JSON files.

## Prerequisites

- [Deno](https://deno.com/manual@v1.33.3/getting_started/installation)

## Usage

The JSON files should be in subfolders of the `data` folder (you need to create
it next to the `main.js` file if it isn't present). This Script is intended to
analyse multiple regions simultaneously. Each region will have its own output
csv and json, and there will also be one global csv and json. The regions are represented by the
folders in `data`.

CLI command to run:

```
deno run --allow-read --allow-write main.js
```

### Additional Arguments
You can also specify a filename for the combined region csv and json, like this:
```
deno run --allow-read --allow-write main.js RegionData
```
This will result in `RegionData.csv` as well as `RegionData.json` being created instead of the default `AllRegions.csv` and `AllRegions.json`.