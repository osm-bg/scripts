import dotenv from 'dotenv';
dotenv.config();

const OSM_API_BASE = 'https://api.openstreetmap.org/api/0.6';
const OSM_ACCESS_TOKEN = process.env.OSM_ACCESS_TOKEN;
const SCRIPT_VERSION = '20260410';


function generate_osm_xml_for_changeset(tags) {
    if(!tags['created_by']) {
        tags['created_by'] = `Dimitar155-bot-v${SCRIPT_VERSION}`;
    }
    const xml_parts = [];
    xml_parts.push(`<osm>`);
    xml_parts.push(`<changeset>`);
    for(const [key, value] of Object.entries(tags)) {
        xml_parts.push(`<tag k="${key}" v="${value}" />`);
    }
    xml_parts.push(`</changeset>`);
    xml_parts.push(`</osm>`);
    return xml_parts.join('\n');
}

function generate_osm_change_xml(changeset_id, elements) {
    const xml_parts = [];
    xml_parts.push(`<osmChange version="0.6" generator="update-shops">`);
    for(const element of elements) {
        if(!element.modified) {
            continue;
        }
        xml_parts.push(`<modify>`);
        if(element.type === 'node') {
            xml_parts.push(`<node id="${element.id}" version="${element.version++}" changeset="${changeset_id}" visible="true" lat="${element.lat}" lon="${element.lon}">`);
        }
        else {
            xml_parts.push(`<${element.type} id="${element.id}" version="${element.version++}" changeset="${changeset_id}" visible="true">`);
        }
        if(element.type === 'way' && Array.isArray(element.nodes)) {
            for(const node_id of element.nodes) {
                xml_parts.push(`<nd ref="${node_id}" />`);
            }
        }
        else if(element.type === 'relation' && Array.isArray(element.members)) {
            for(const member of element.members) {
                xml_parts.push(`<member type="${member.type}" ref="${member.ref}" role="${member.role || ''}" />`);
            }
        }
        for(const [key, value] of Object.entries(element.tags)) {
            xml_parts.push(`<tag k="${key}" v="${value}" />`);
        }
        xml_parts.push(`</${element.type}>`);
        xml_parts.push(`</modify>`);
    }
    xml_parts.push(`</osmChange>`);
    return xml_parts.join('\n');
}

export function upload_elements_to_osm(changeset_tags, elements) {
    var changeset_id;
    return fetch(`${OSM_API_BASE}/changeset/create`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${OSM_ACCESS_TOKEN}`
        },
        body: generate_osm_xml_for_changeset(changeset_tags)
    })
    .then(res => res.text())
    .then(loc_changeset_id => {
        console.log(`Created changeset ${loc_changeset_id} for uploading ${elements.length} modified elements`);
        changeset_id = loc_changeset_id;
        return fetch(`${OSM_API_BASE}/changeset/${changeset_id}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OSM_ACCESS_TOKEN}`,
                'Content-Type': 'text/xml'
            },
            body: generate_osm_change_xml(changeset_id, elements)
        })
    })
    .then(() => {
        console.log(`Uploaded changeset ${changeset_id}, now closing it`);
        return fetch(`${OSM_API_BASE}/changeset/${changeset_id}/close`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${OSM_ACCESS_TOKEN}`
            }
        });
    });
}
