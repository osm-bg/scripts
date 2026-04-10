import { modify_tag } from "../utils.js";

const operator_type_map = [
    {
        operators: new Set(['Екопак']),
        colours: [
            {
                colour: 'blue',
                accept: ['recycling:paper_packaging'],
                reject: []
            },
            {
                colour: 'green',
                accept: ['recycling:glass_bottles'],
                reject: ['recycling:glass']
            },
            {
                colour: 'yellow',
                accept: ['recycling:metal_packaging', 'recycling:plastic_packaging'],
                reject: ['recycling:plastic']
            },
            {
                colour: 'pet_drink_bottles',
                accept: ['recycling:pet_drink_bottles'],
                reject: []
            }
        ],
    },
    {
        operators: new Set([ 'Екобулпак', 'Булекопак', 'Еко Партнърс' ]),
        colours: [
            {
                colour: 'green',
                accept: ['recycling:glass_bottles'],
                reject: ['recycling:glass']
            },
            {
                colour: 'yellow',
                accept: ['recycling:metal_packaging', 'recycling:plastic_packaging', 'recycling:paper_packaging'],
                reject: ['recycling:plastic']
            },
            {
                colour: 'pet_drink_bottles',
                accept: ['recycling:pet_drink_bottles'],
                reject: []
            }
        ],
    },
    {
        operators: new Set([ 'M-Texx', 'TexCycle', 'TEXAID Bulgaria' ]),
        colours: false,
        accept: ['recycling:clothes', 'recycling:shoes'],
    },
    {
        operators: new Set([ 'Уон' ]),
        colours: false,
        accept: ['recycling:cooking_oil']
    }
];

const default_filter_fn = (container, operators) => operators.has(container.tags['operator']);
for(const type of operator_type_map) {
    if(!type.filter_fn) {
        type.filter_fn = default_filter_fn;
    }
}

function find_operator_type(operator) {
    for(const type of operator_type_map) {
        if(type.operators.has(operator)) {
            return type;
        }
    }
    return null;
}

function adjust_recycling_tags(container, operator_data) {
    const set_accept = [];
    const set_reject = [];

    const { colours, accept } = operator_data;

    if(colours) {
        for(const { colour, accept: colour_accept, reject: colour_reject } of colours) {
            const colour_tag = container.tags[`count:${colour}`];
            if(colour_tag && parseInt(colour_tag) > 0) {
                set_accept.push(...colour_accept);
                set_reject.push(...colour_reject);
            }
        }
    }
    else if(accept) {
        set_accept.push(...accept);
    }

    for(const tag of set_accept) {
        modify_tag(container, tag, 'yes');
    }
    for(const tag of set_reject) {
        modify_tag(container, tag, 'no');
    }
    const all_relevant_tags = [...set_accept, ...set_reject];
    for(const tag in container.tags) {
        if(!tag.startsWith('recycling:')) {
            continue;
        }
        const is_tag_irrelevant = !all_relevant_tags.includes(tag);
        if(is_tag_irrelevant) {
            modify_tag(container, tag, false);
        }
    }
}

export function normalise_recycling(container) {
    const operator = container.tags['operator'];
    if(!operator) {
        return;
    }
    const operator_data = find_operator_type(operator);
    if(!operator_data) {
        return;
    }
    adjust_recycling_tags(container, operator_data);
}
