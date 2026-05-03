import queryOverpass from '@derhuerst/query-overpass';

import { normalise_operator } from './normalise-operator.js';
import { normalise_recycling } from './normalise-recycling.js';
import { validate_counts } from './validate_counts.js';
import { is_inside_square } from './../utils.js';

import { upload_elements_to_osm } from '../osm.js';

import fs from 'fs';

const args = process.argv.slice(2);
const debug = args.includes('--debug') || args.includes('-d');
if(debug) {
    console.log('Debug mode enabled');
}

const query = `
[out:json][timeout:25];
area(id:3600186382)->.searchArea;
node[amenity=recycling][count](area.searchArea);
out meta;`;

async function run() {
    console.log('Sending Overpass query...');
    const containers = await queryOverpass(query);
    console.log(`Fetched ${containers.length} containers from Overpass API`);
    for(const container of containers) {
        normalise_operator(container);
        normalise_recycling(container);
        validate_counts(container);
    }
    const modified = containers.filter(c => c.modified);
    console.log(`Normalised ${modified.length} containers`);
    const squares = [];
    for(const container of modified) {
        const { lat, lon } = container;
        let square_found = false;
        for(const square of squares) {
            if(is_inside_square(lat, lon, square)) {
                square.containers.push(container);
                square_found = true;
                break;
            }
        }
        if(!square_found) {
            const square_size = 0.15; // ~15 km
            const new_square = {
                minLat: lat - square_size / 2,
                maxLat: lat + square_size / 2,
                minLon: lon - square_size / 2,
                maxLon: lon + square_size / 2,
                containers: [container],
            };
            squares.push(new_square);
        }
    }
    console.log(`Modified containers grouped into ${squares.length} squares`);
    if(debug) {
        process.chdir('./recycling-containers');
        if(fs.existsSync('./output')) {
            fs.rmSync('./output', { recursive: true });
        }
        fs.mkdirSync('./output');
        process.chdir('./output');
    }
    for(const [i, square] of squares.entries()) {
        if(debug) {
            console.log(square.containers);
            fs.writeFileSync(`square_${i + 1}.json`, JSON.stringify(square.containers, null, 2));
            continue;
        }
        else{
            await upload_elements_to_osm({
                comment: 'хармонизирани тагове за приемани отпадъци в контейнери за разделно събиране',
                script: 'recycling-containers',
            }, square.containers);
        }
    }
}

run();
