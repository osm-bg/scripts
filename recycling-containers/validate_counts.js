export function validate_counts({id, tags}) {
    if(!['Екопак', 'Булекопак', 'Екобулпак'].includes(tags['operator'])) {
        return;
    }
    const total = parseInt(tags['count']);
    let sum = 0;
    for(const [key, value] of Object.entries(tags)) {
        if(!key.startsWith('count:')) {
            continue;
        }
        const count = parseInt(value);
        if(isNaN(count)) {
            continue;
        }
        sum += count;
    }
    if(total !== sum) {
        console.warn(`Count mismatch: total=${total} sum_of_types=${sum} for https://osm.org/node/${id}`);
    }
}
