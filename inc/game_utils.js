let game_constants;
let ui_data;

function load_json(path) {
    return fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }).then(response_json => {
            return response_json;
        }).catch(error => {
            console.error('Failed to fetch json:', error);
            throw error;
        });
}

function load_data() {
    return Promise.all([load_json(game_constants_path), load_json(ui_data_path)])
        .then(json => {
            game_constants = json[0];
            ui_data = json[1];
        })
        .catch(error => {
            console.error('Failed to fetch data:', error);
            throw error;
        });
}

function game_unit_from_index(index) {
    return game_constants.units[index];
}

function game_trait_from_index(index) {
    return game_constants.traits[index];
}

function build_context(parser_module, comp_size, forced_units, removed_units, trait_bonuses) {

    game_constants.traits.forEach(trait => {

        var trait_index = parser_module.exports.add_game_trait(trait.scalar);

        trait.value.forEach(trait_value => {
            parser_module.exports.push_trait_value(trait_index, trait_value);
        });

    });

    game_constants.units.forEach(unit => {

        var unit_index = parser_module.exports.add_game_unit(unit.cost, unit.hidden_value);

        unit.traits.forEach(trait_index => {
            parser_module.exports.push_unit_trait(unit_index, trait_index);
        });

    });

    game_constants.subsets.forEach(subset_info => {

        var subset_info_index = parser_module.exports.add_subset_info();

        subset_info.forced_units.forEach(unit_index => {
            parser_module.exports.add_subset_forced_unit(subset_info_index, unit_index);
        });

        subset_info.removed_units.forEach(unit_index => {
            parser_module.exports.add_subset_removed_unit(subset_info_index, unit_index);
        });

        subset_info.bonus_traits_mods.forEach(bonus_traits_mod => {
            parser_module.exports.set_subset_trait_bonus_mod(subset_info_index, bonus_traits_mod.trait_index, bonus_traits_mod.value);
        });

        parser_module.exports.set_subset_comp_size_mod(subset_info_index, subset_info.comp_size_mod);

    });

    parser_module.exports.set_global_comp_size(comp_size);

    if (forced_units) {
        forced_units.forEach(unit_index => {
            parser_module.exports.add_global_forced_unit(unit_index);
        });
    }

    if (removed_units) {
        removed_units.forEach(unit_index => {
            parser_module.exports.add_global_removed_unit(unit_index);
        })
    }

    if (trait_bonuses) {
        trait_bonuses.forEach(trait_bonus => {
            parser_module.exports.set_global_trait_bonus(trait_bonus.trait_index, trait_bonus.count);
        });
    }

    parser_module.exports.parse_subsets();

    return BigInt(parser_module.exports.get_total_subset_combinations_count());
}

function add_result_to_buffer(result_buffer, result) {
    if (result.value < result_buffer.min_value) {
        return;
    }
    result_buffer.results[result_buffer.results_count - 1] = result;
    result_buffer.results.sort((a, b) => {
        if (!a) {
            return 1;
        }
        if (!b) {
            return -1;
        }
        return b.value - a.value;
    });
    if (result_buffer.results[result_buffer.results_count - 1]) {
        result_buffer.min_value = result_buffer.results[result_buffer.results_count - 1].value;
    }
}

function decode_worker_result(comp, value) {
    let units = [];
    let traits_map = new Map();
    for (i = 0n; i < 64n; ++i) {
        if ((1n << i) & comp) {
            const game_unit = game_unit_from_index(i);
            game_unit.traits.forEach(trait_index => {
                if (traits_map.has(trait_index)) {
                    traits_map.get(trait_index).count++;
                } else {
                    traits_map.set(trait_index, {
                        trait: trait_index,
                        count: 1
                    });
                }
            });
            units.push(i)
        }
    }
    let traits = Array.from(traits_map, ([_, value]) => value);
    // TODO: Account for trait modifiers from subsets and extra traits
    return { units, traits, value };
}

