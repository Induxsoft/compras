var filter = 
{
    init()
    {
        const opt_date_cont = document.querySelector('#options_date_container');
        const btn_dr_cancel = document.querySelector('#btn_dr_cancel');
        const btn_dr_change = document.querySelector('#btn_dr_change');
        const date_range_tb = document.querySelector('#date-range-tab');
        const date_month_tb = document.querySelector('#months-tab');
        const select_date_y = document.querySelector('#select_year_filter');
        const select_almacn = document.querySelector('select[name="almc"]');
        const radios_submit = document.querySelectorAll('.submit');
        const month_options = document.querySelectorAll('#month_options_container input[name="month"]');
        
        if (opt_date_cont) this.date_range_events(opt_date_cont);
        if (btn_dr_cancel) btn_dr_cancel.addEventListener('click', e => this.edit_date_range(false));
        if (btn_dr_change) btn_dr_change.addEventListener('click', e => this.edit_date_range(true));
        if (date_range_tb) date_range_tb.addEventListener('click', e => { this.disable_tab_panel(1); this.select_tab(0)});
        if (date_month_tb) date_month_tb.addEventListener('click', e => { this.disable_tab_panel(0); this.select_tab(1)});
        if (select_date_y) select_date_y.addEventListener('change', e => this.submit_filter());
        if (select_almacn) select_almacn.addEventListener('change', e => this.submit_filter());
        if (radios_submit) radios_submit.forEach(rad => rad.addEventListener('change', e => this.submit_filter()));
        if (month_options) month_options.forEach(opt => opt.addEventListener('change', e => this.submit_filter()));
    },
    date_range_events(container)
    {
        const radios = container.querySelectorAll('input[type="radio"]');
        const custom = document.querySelector('#op_r5');
        radios.forEach(radio => radio.addEventListener('change', e => this.edit_date_range(custom.checked, true)));
    },
    edit_date_range(show=false, disable=false)
    {
        document.querySelectorAll('#dates_range_container input[type="date"]').forEach(input => input.disabled = !show);
        
        const btn_dr_accept = document.querySelector('#btn_dr_accept');
        const btn_dr_cancel = document.querySelector('#btn_dr_cancel');
        const btn_dr_change = document.querySelector('#btn_dr_change');
        
        if (btn_dr_accept) btn_dr_accept.classList.toggle('d-none', !show);
        if (btn_dr_cancel) btn_dr_cancel.classList.toggle('d-none', !show);
        if (btn_dr_change) {
            btn_dr_change.classList.toggle('d-none', show);
            btn_dr_change.toggleAttribute('disabled', disable);
        }
    },
    disable_tab_panel(disablePanel)
    {
        const panel1 = document.querySelector('#date-range');
        const panel2 = document.querySelector('#months');
        if (panel1) panel1.toggleAttribute('disabled', (disablePanel==0));
        if (panel2) panel2.toggleAttribute('disabled', (disablePanel==1));
    },
    submit_filter()
    {
        const form = document.querySelector('#form_filter');
        if (form) form.submit();
    },
    select_tab(tab)
    {
        const input_tab_selected = document.querySelector('#input_tab_selected');
        if (input_tab_selected) input_tab_selected.value = tab;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    filter.init();
});