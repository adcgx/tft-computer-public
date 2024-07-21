const game_constants_path = 'res/set11/game.json';
const ui_data_path = 'res/set11/ui.json';

let units_ui_exalted = [];

function onclick_unit_ui_exalted(index) {
    let unit_ui_exalted = units_ui_exalted[index];

    if (unit_ui_exalted.figure_element.classList.contains('unselectable'))
        return;

    if (unit_ui_exalted.is_selected === true) {
        unit_ui_exalted.is_selected = false;
    } else {
        unit_ui_exalted.is_selected = true;
    }

    unit_ui_exalted.figure_element.classList.toggle('selected');
}

// Give units the exalted trait 
document.addEventListener('before_build_context', (_) => {
    let exalted_units = [];

    units_ui_exalted.forEach(units_ui_exalted => {
        if (units_ui_exalted.is_selected === true) {
            exalted_units.push(units_ui_exalted.game_index);
        }
    });

    const exalted_trait_index = 17;

    exalted_units.forEach(exalted_unit_index => {
        game_constants.units[exalted_unit_index].traits.push(exalted_trait_index);
    });
});

document.addEventListener('on_init_tables_foreach_unit', (e) => {
    const index = e.detail.index;
    const reverse_index = e.detail.reverse_index;

    let cost_str = unit_cost_string(reverse_index);
    const unit_table_row_id = 'unit_table_' + cost_str + '_row';

    let unit_figure_exalted = add_fig_to_table(
        'unit_table',
        unit_table_row_id,
        'unit_table_exalted_units_column',
        'unit_fig_container',
        ui_data.units[reverse_index],
        ui_data.units_sprite_url
    );
        
    unit_figure_exalted.addEventListener("click", function () {
        onclick_unit_ui_exalted(index);
    });

    let unit_ui_exalted = {
        figure_element: unit_figure_exalted,
        game_index: reverse_index,
        is_selected: false
    }

    units_ui_exalted.push(unit_ui_exalted);
})