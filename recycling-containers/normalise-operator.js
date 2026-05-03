import { modify_tag } from "../utils.js";

const operator_wikidata_map = new Map([
    ['екопак', { name: 'Екопак', wikidata: 'Q116687081'}],
    ['екобулпак', { name: 'Екобулпак', wikidata: 'Q116687156'}],
    ['булекопак', { name: 'Булекопак', wikidata: 'Q116687113'}],
    ['m-texx', { name: 'M-Texx', wikidata: 'Q122947768'}],
    ['texcycle', { name: 'TexCycle', wikidata: 'Q85614408'}],
    ['texaid bulgaria', { name: 'TEXAID Bulgaria', wikidata: 'Q1395183'}],
    ['уон', { name: 'Уон', wikidata: 'Q129167135'}],
    ['еко партнърс', { name: 'Еко Партнърс', wikidata: 'Q116687227'}],
]);

export function normalise_operator(container) {
    const operator = container.tags['operator'];
    if(!operator) {
        return;
    }
    const operator_tags = operator_wikidata_map.get(operator.toLowerCase());
    if(!operator_tags) {
        console.warn(`Unknown operator: ${operator}`);
        return;
    }
    modify_tag(container, 'operator', operator_tags.name);
    modify_tag(container, 'operator:wikidata', operator_tags.wikidata);
}
