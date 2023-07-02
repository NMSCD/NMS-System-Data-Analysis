## Summary

This script reads JSON files as returned by the NMS API, then converts that data
into CSV and JSON files.

## Usage

The JSON files should be in subfolders of the `data` folder (you need to create
it next to the `main.ts` file if it isn't present). This Script is intended to
analyse multiple regions simultaneously. Each region will have its own output
csv and json, and there will also be one global csv and json. The regions are represented by the
folders in `data`.

To run, simply double click the `BigData.exe`.

### Additional Options
You can also specify a filename for the combined region csv and json in the CLI, like this:
```
BigData.exe RegionData
```
This will result in `RegionData.csv` as well as `RegionData.json` being created instead of the default `AllRegions.csv` and `AllRegions.json`.
