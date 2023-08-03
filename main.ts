import { datetime } from "ptera";

interface SystemDataRaw {
	DD: {
		UA: string
		DT?: string;
		VP?: string[];
	};
	PTK: string;
	USN: string;
	TS: string;
	DM?: {
		CN?: string;
	}
	PT?: string;
	UID?: string;
	RID?: string;
	CV?: string;
}

interface SystemData {
	Name: string;
	Glyphs: string;
	Discoverer: string;
	Platform: string;
	Timestamp: string;
	UnixTimestamp?: number;
	'Correctly Tagged'?: boolean;
}

interface RegionData {
	[key: string]: {
		[key: string]: string;
	}
}

const dataFolder = './data/';
const regions = Deno.readDirSync(dataFolder);
const civ: string = Deno.args[0] || 'AllRegions';
const validCivs = Object.keys(getRegionData());
const globalDataArray: SystemData[] = [];
for (const region of regions) {
	const regionName = region.name;
	const systems = Deno.readDirSync(dataFolder + regionName);
	const regionDataArray: SystemData[] = [];
	for (const system of systems) {
		if (!system.name.endsWith('.json')) continue;
		const fileContent = Deno.readTextFileSync(dataFolder + region.name + '/' + system.name);
		const systemDataObj: SystemDataRaw = (() => {
			try {
				const json = JSON.parse(fileContent)[0];
				return json;
			} catch (_error) {
				return {
					DD: { UA: '' },
					USN: '',
					PTK: '',
					TS: '',
				}
			}
		})();
		const extractedDataObj = extractData(systemDataObj);
		regionDataArray.push(extractedDataObj);
	}
	createDataFile(regionName, regionDataArray);
	if (validCivs.includes(civ.toLowerCase())) createRegionTxt(regionName, regionDataArray);
	console.log(`${regionName} done`);
	globalDataArray.push(...regionDataArray);
}
createDataFile(civ, globalDataArray);
console.log(`Finished!`);


function createDataFile(regionName: string, regionDataArray: SystemData[]) {
	createCSV(regionName, regionDataArray);
	createJSON(regionName, regionDataArray);
}

function extractData(obj: SystemDataRaw): SystemData {
	const address = (() => {
		const addressString = obj.DD.UA;
		const addressArray = addressString.split('');
		addressArray.shift()
		addressArray.shift();			// remove first two 0
		addressArray.splice(4, 2);		// NoSonar remove galaxy index;
		return addressArray.join('').toUpperCase();
	})();

	const outputObj: SystemData = {
		Name: obj?.DM?.CN || '',
		Glyphs: address,
		Discoverer: obj.USN,
		Platform: obj.PTK,
		Timestamp: buildDate(obj.TS),
		UnixTimestamp: parseInt(obj.TS) * 1000,
	}

	if (validCivs.includes(civ.toLowerCase())) {
		const { Glyphs, Name } = outputObj;
		const tagStatus = isCorrectlyTagged(Glyphs, Name);
		outputObj['Correctly Tagged'] = tagStatus;
	}

	return outputObj;
}

function createCSV(filepath: string, bodyDataArray: SystemData[]): void {
	const csvData = structuredClone(bodyDataArray).map((item: SystemData) => {
		delete item.UnixTimestamp;
		return item;
	})
	const dataObj = csvData[0];
	if (!dataObj) return;
	const bodyString = createCSVBody(csvData);
	const sep = `sep=,`;
	const header = Object.keys(dataObj).join('","');
	const dataArr = [sep, `"${header}"`, bodyString];
	Deno.writeTextFileSync(`${filepath}.csv`, dataArr.join('\n'));
}

function createCSVBody(regionDataArray: SystemData[]) {
	const outputArray: string[] = [];
	for (const systemObj of regionDataArray) {
		const systemDataArray = Object.values(systemObj);
		outputArray.push(`"${systemDataArray.join('","')}"`);
	}
	return outputArray.join('\n');
}

function buildDate(timestamp: string) {
	if (!timestamp) return '';
	const timestampNum = parseInt(timestamp);
	const milliseconds = timestampNum * 1000;	// NoSonar the game uses seconds, but JS uses milliseconds
	const dateObj = datetime(milliseconds);
	const dateString = dateObj.format('YYYY-MM-dd');
	return dateString;
}

function isCorrectlyTagged(glyphs: string, name: string): boolean {
	if (!name) return false;
	const expected = buildExpectedTag(glyphs);
	return name.startsWith(expected);
}

function buildExpectedTag(glyphs: string): string {
	const regionData = getRegionData();
	const SIV = (() => {
		const SID = glyphs.substring(1, 4);		// NoSonar this gets the system ID
		const SIDDecNumber = parseInt(SID, 16);
		const SIDNumber = SIDDecNumber.toString(16).toUpperCase();		// NoSonar this is dec to hex conversion
		return SIDNumber.replaceAll('69', '68+1');
	})();
	const region = glyphs.substring(4);		// NoSonar this gets the region glyphs
	const regionIndex = Object.keys(regionData[civ.toLowerCase()]).indexOf(region) + 1;
	const expected = `[HUB${regionIndex}-${SIV}]`;
	return expected;
}

function createRegionTxt(regionName: string, regionDataArray: SystemData[]): void {
	const headers = ['Other Systems', 'Missing HUB Tag'].map(heading => `==${heading}==`);
	const other: string[] = [];
	const missing: string[] = [];
	const arrayCollection = [other, missing];
	const txtContent: string[] = [];

	for (const system of regionDataArray) {
		if (system['Correctly Tagged']) {
			other.push(system.Name);
		} else {
			const expected = buildExpectedTag(system.Glyphs);
			if (system.Name) missing.push(`${system.Name} (Expected Tag: ${expected.substring(1, expected.length - 1)})`);
		}
	}

	for (let i = 0; i < arrayCollection.length; i++) {
		const array = arrayCollection[i].map(item => '* ' + item.replace(/[{\[\]}]/g, ''));		// NoSonar I'm pretty sure the escape characters are necessary
		if (!array.length) continue;
		array.sort();
		txtContent.push(headers[i], ...array, '');
	}

	const content = txtContent.join('\n');
	if (content) Deno.writeTextFileSync(`${regionName}.txt`, content.trim());
}

function createJSON(filepath: string, dataArray: SystemData[]): void {
	Deno.writeTextFileSync(`${filepath}.json`, JSON.stringify(dataArray, null, 2));		// NoSonar this sets an indent of 2 spaces in the JSON file
}

function getRegionData(): RegionData {
	return {
		eishub: {
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
		},
		calhub: {
			'F9556C30': 'Uisaor Spur',
			'F9555C30': 'The Arm of Kiffeyn',
			'F9555C31': 'Ilongl Cloud',
			'F9556C31': 'The Arm of Taticale',
			'F9557C31': 'Egerap Anomaly',
			'F9557C30': 'Wakestones Expanse',
			'F9557C2F': 'Erhahn Fringe',
			'F9556C2F': 'Imrikians Terminus',
			'F9555C2F': 'Imedeili',
			'FA556C30': 'Kovasu Adjunct',
			'F8556C30': 'Lossians Boundary'
		},
		ghub: {
			'F9556C30': 'The Arm of Vezitinen',
			'F9555C30': 'Canthian',
			'F9555C31': 'Dexterf Sector',
			'F9556C31': 'The Arm of Katteus',
			'F9557C31': 'Nugsdor Adjunct',
			'F9557C30': 'Uefert Nebula',
			'F9557C2F': 'Widraik',
			'F9556C2F': 'Airnaka Conflux',
			'F9555C2F': 'Sivess Instability',
			'FA556C30': 'Savenix Instability',
			'F8556C30': 'Nonlopsi Instability'
		}
	}
}
