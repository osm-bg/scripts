export function modify_tag(osm_element, key, value) {
    const tags = osm_element.tags;
    if(tags[key] === value) {
        return;
    }
    else if(value === false && key in tags) {
        // delete
        delete tags[key];
        osm_element.modified = true;
    }
    else if(value !== false) {
        // add / modify
        const curr_value = tags[key];
        if(curr_value !== value) {
            tags[key] = value;
            osm_element.modified = true;
        }
    }
}

export function elements_to_level0(elements) {
    const request_line = [];
    const rows = [];
    for(const el of elements) {
        // console.log(el);
        if(el.type === 'node') {
            request_line.push(`n${el.id}`);
            rows.push(`node ${el.id}: ${el.lat},${el.lon}`);
        }
        else if(el.type === 'way') {
            request_line.push(`w${el.id}`);
            rows.push(`way ${el.id}`);
        }
        else if(el.type === 'relation') {
            request_line.push(`r${el.id}`);
            rows.push(`relation ${el.id}`);
        }
        
        for(const [key, value] of Object.entries(el.tags || {})) {
            rows.push(`  ${key} = ${value}`);
        }
        if(el.type === 'way' && Array.isArray(el.nodes)) {
            for(const node_id of el.nodes) {
                rows.push(`  nd ${node_id}`);
            }
        }
        else if(el.type === 'relation' && Array.isArray(el.members)) {
            for(const member of el.members) {
                if(member.type == 'node') {
                    rows.push(`  nd ${member.ref}`);
                }
                else if(member.type == 'way') {
                    rows.push(`  wy ${member.ref}`);
                }
                else if(member.type == 'relation') {
                    rows.push(`  rel ${member.ref}`);
                }
                if(member.role) {
                    rows[rows.length - 1] += ` ${member.role}`;
                }
            }
        }
        rows.push('');
    }
    const final_text = request_line.join(',') + '\n\n' + rows.join('\n');
    return final_text;
}

export function is_inside_square(lat, lon, square) {
    const { minLat, maxLat, minLon, maxLon } = square;
    return minLat <= lat && lat <= maxLat && minLon <= lon && lon <= maxLon;
}

export function group_to_squares(elements, square_size = 0.15) {
    const squares = [];
    for(const el of elements) {
        const { lon, lat } = el.center || el;
        let square_found = false;
        for(const square of squares) {
            if(is_inside_square(lat, lon, square)) {
                square.elements.push(el);
                square_found = true;
                break;
            }
        }
        if(!square_found) {
            const new_square = {
                minLat: lat - square_size / 2,
                maxLat: lat + square_size / 2,
                minLon: lon - square_size / 2,
                maxLon: lon + square_size / 2,
                elements: [el],
            };
            squares.push(new_square);
        }
    }
    return squares;
}

import fs from 'fs';
export function save_squares_to_files(squares, directory) {
    if(fs.existsSync(directory)) {
        fs.rmSync(directory, { recursive: true });
    }
    fs.mkdirSync(directory);
    process.chdir(directory);
    squares.sort((a, b) => a.elements.length - b.elements.length);
    for(const [i, square] of squares.entries()) {
        const text = elements_to_level0(square.elements);
        const file_number = i.toString().padStart(2, '0');
        const filename = `batch-${file_number}.txt`;
        fs.writeFileSync(filename, text, 'utf8');
    }
}
