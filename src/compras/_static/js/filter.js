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
        const input_search = document.getElementById("input_search");
        const btn_search = document.getElementById("btn_search");
        
        if (opt_date_cont) this.date_range_events(opt_date_cont);
        if (btn_dr_cancel) btn_dr_cancel.addEventListener('click', e => this.edit_date_range(false));
        if (btn_dr_change) btn_dr_change.addEventListener('click', e => this.edit_date_range(true));
        if (date_range_tb) date_range_tb.addEventListener('click', e => { this.disable_tab_panel(1); this.select_tab(0)});
        if (date_month_tb) date_month_tb.addEventListener('click', e => { this.disable_tab_panel(0); this.select_tab(1)});
        if (select_date_y) select_date_y.addEventListener('change', e => this.submit_filter());
        if (select_almacn) select_almacn.addEventListener('change', e => this.submit_filter());
        if (radios_submit) radios_submit.forEach(rad => rad.addEventListener('change', e => this.submit_filter()));
        if (month_options) month_options.forEach(opt => opt.addEventListener('change', e => this.submit_filter()));
        if (input_search) input_search.addEventListener("keydown", (e) => { if (e.key === "Enter" && input_search.value.trim() != "") this.submit_filter() });
        if (btn_search)
        {
            let icon_cancel = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/></svg>';
            let icon_filter = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-funnel" viewBox="0 0 16 16"><path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2z"/></svg>';

            if (input_search.value.trim() != "") {
                input_search.disabled = true;
                btn_search.type = "button";
                btn_search.innerHTML = icon_cancel;
            }
            else {
                input_search.disabled = false;
                btn_search.type = "submit";
            }

            btn_search.addEventListener("click", (event) => {
                event.preventDefault();
                if (btn_search.type == "submit") {
                    if (input_search.value.trim() != "") this.submit_filter();
                }
                else
                {
                    input_search.disabled = false;
                    btn_search.type = "submit";
                    btn_search.innerHTML = icon_filter;
                }
            });
        }
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