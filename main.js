import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";

const dataFolder = './data/';
const regions = Deno.readDirSync(dataFolder);
const globalDataArray = [];
for (const region of regions) {
	const regionName = region.name;
	const systems = Deno.readDirSync(dataFolder + regionName);
	const regionDataArray = [];
	for (const system of systems) {
		const fileContent = Deno.readTextFileSync(dataFolder + region.name + '/' + system.name).trim();
		const intermediateFileContent = fileContent.trim().substring(4, fileContent.length - 5);
		const useableFileContent = (() => {
			const arr = intermediateFileContent.trim().split('');
			arr.pop();
			const filteredArr = arr.filter(char => char != '\\');
			const str = filteredArr.join('');
			return str.replace(/\x00/g, '');	// NoSonar (I have no idea why this is necessary, but it is sadly...)
		})();
		const systemDataObj = JSON.parse(useableFileContent)[0];
		const extractedDataObj = extractData(systemDataObj);
		regionDataArray.push(extractedDataObj);
		globalDataArray.push(extractedDataObj);
	}
	createCSV(regionName, regionDataArray);
	console.log(`${regionName} done`)
}
createCSV('EisHub', globalDataArray);
console.log(`Finished!`)


function extractData(obj) {
	const address = (() => {
		const addressString = obj.DD.UA;
		const addressArray = addressString.split('');
		addressArray.shift()
		addressArray.shift();	// remove first two 0
		addressArray.splice(4, 2);		// remove galaxy index;
		return addressArray.join('').toUpperCase();
	})();

	const outputObj = {
		Glyphs: address,
		Name: obj?.DM?.CN || '',
		Discoverer: obj.USN,
		Platform: obj.PTK,
		Timestamp: buildDate(obj.TS),
	}
	return outputObj;
}

function createCSV(filepath, bodyDataArray) {
	const dataObj = bodyDataArray[0];
	const bodyString = createCSVBody(bodyDataArray);
	const sep = `sep=,`;
	const header = Object.keys(dataObj).join('","');
	const dataArr = [sep, `"${header}"`, bodyString];
	Deno.writeTextFileSync(`${filepath}.csv`, dataArr.join('\n'));
}

function createCSVBody(regionDataArray) {
	const outputArray = [];
	for (const systemObj of regionDataArray) {
		const systemDataArray = Object.values(systemObj);
		outputArray.push(`"${systemDataArray.join('","')}"`);
	}
	return outputArray.join('\n');
}

function buildDate(timestamp) {
	const milliseconds = timestamp * 1000;
	const dateObj = datetime(milliseconds);
	const dateString = dateObj.format('YYYY-MM-dd');
	return dateString;
}



/*
{
  year: 1970,
  month: 1,
  day: 19,
  hour: 1,
  minute: 1,
  second: 35,
  millisecond: 79,
  timezone: "Europe/Berlin",
  valid: true,
  locale: "en"
}



[
  {
	PT: "Discovery",
	DD: { UA: "0001d109f9556c30", DT: "SolarSystem", VP: [ "2de0d246a595b235" ] },
	DM: { CN: "[HUB1-1D1] Ranisysl" },
	PTK: "ST",
	UID: "76561198029000485",
	USN: "Kroman",
	TS: 1539383979,
	RID: "tYQ9rBVBu002B4D6ucsDvGFEKHUiZFLgTnoR0CmWuRxCI3g=",
	CV: 5000
  }
]


[
  {
	PT: "Discovery",
	DD: { UA: "0001cc09f9556c30", DT: "SolarSystem", VP: [ "cdf3df6d9e29a310" ] },
	PTK: "XB",
	UID: "2533274816577052",
	USN: "MordecaiZer0",
	TS: 1587339344,
	RID: "OuhFANlo4bEA3Ub8gNxhuR8ZMXJRk4pDKjnLumVhotc=",
	CV: 9000
  }
]


*/