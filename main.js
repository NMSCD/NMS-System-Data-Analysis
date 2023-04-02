import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";

const dataFolder = './data/';
const regions = Deno.readDirSync(dataFolder);
const civ = Deno.args[0] || 'AllRegions';
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
createCSV(civ, globalDataArray);
console.log(`Finished!`)


function extractData(obj) {
	const address = (() => {
		const addressString = obj.DD.UA;
		const addressArray = addressString.split('');
		addressArray.shift()
		addressArray.shift();			// remove first two 0
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

	if (civ) {
		const validCivs = Object.keys(getRegionData());
		const validCivsLowercase = validCivs.map(item => item.toLowerCase());
		if (validCivsLowercase.includes(civ.toLowerCase())) {
			const { Glyphs, Name } = outputObj;
			const tagStatus = isCorrectlyTagged(Glyphs, Name);
			outputObj['Correctly Tagged'] = tagStatus;
		}
	}

	return outputObj;
}

function createCSV(filepath, bodyDataArray) {
	const dataObj = bodyDataArray[0];
	if (!dataObj) return;
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

function isCorrectlyTagged(glyphs, name) {
	if (!name) return false;
	const regionData = getRegionData()
	const SIV = (() => {
		const SID = glyphs.substring(1, 4);
		const SIDDecNumber = parseInt(SID, 16);
		const SIDNumber = SIDDecNumber.toString(16).toUpperCase();
		if (SIDNumber == 69) return '68+1';
		return SIDNumber;
	})();
	const region = glyphs.substring(4);
	const regionIndex = Object.keys(regionData[civ]).indexOf(region) + 1;
	return name.startsWith(`[HUB${regionIndex}-${SIV}]`);
}

function getRegionData() {
	return {
		EisHub: {
			'F9556C30': 'Riwala',
			'F9555C30': 'Omskio Instability',
			'F9555C31': 'Marcki',
			'F9556C31': 'Anolamga Spur',
			'F9557C31': 'Sea of Zonyayp',
			'F9557C30': 'Rayuyar Band',
			'F9557C2F': 'Umaton Instability',
			'F9556C2F': 'Exramb Adjunct',
			'F9555C2F': 'Ologowe Fringe',
			'FA556C30': 'Yatrifex',
			'FA555C30': 'Yeiada Sector',
			'FA555C31': 'Iptrevs Fringe',
			'FA556C31': 'Yamiraith Sector',
			'FA557C31': 'Wedragi Spur',
			'FA557C30': 'Rezhensk',
			'FA557C2F': 'Sobert Cloud',
			'FA556C2F': 'Umtats Anomaly',
			'FA555C2F': 'Tavill',
			'F8556C30': 'Qangew Expanse',
			'F8555C30': 'Nijhwal Boundary',
			'F8555C31': 'Usband Cluster',
			'F8556C31': 'Ejongaa Anomaly',
			'F8557C31': 'Zahrel Expanse',
			'F8557C30': 'The Arm of Fupand',
			'F8557C2F': 'Cuculta',
			'F8556C2F': 'Etmarao',
			'F8555C2F': 'Otreie Void'
		}
	}
}
