document.addEventListener("DOMContentLoaded", () => 
{
    let error_span = document.getElementById("err-msg");
    let mainActionBar = document.getElementById("main_action_bar");
    let btnGuardarDoc = document.getElementById("btn-guardar");
    let btnCerrarDoc = document.getElementById("btn-cerrar");
    let btnProcesarDoc = document.getElementById("btn-procesar");
    let btnCancelarDoc = document.getElementById("btn-cancelar");
    let btnReAbrirDoc = document.getElementById("btn-reabrir");

    let formPedido = document.getElementById("form_pedido");
    let ikProveedor = document.getElementById("sel_proveedor");
    let ikProducto = document.getElementById("sel_producto");
    let selDocumento = document.getElementById("sel_documento");
    let selDivisa = document.getElementById("sel_divisa");
    let txtTipoCambio = document.getElementById("txt_tipocambio");
    let txt_statusadministrativo = document.getElementById("txt_statusadministrativo")
    let txt_detalle_compra = document.getElementById("txt_detalle_compra");
    
    let tblActionBar = document.getElementById("tbl_action_bar");
    let btnAddRow = document.getElementById("btn-add-row");
    let btnDelRow = document.getElementById("btn-del-row");
    let divTableProductos = document.getElementById("div_tbl_productos")
    let lblSubtotal = document.getElementById("lbl_subtotal");
    let lblDescuento = document.getElementById("lbl_descuento");
    let lblImpuesto = document.getElementById("lbl_impuesto");
    let lblImporte = document.getElementById("lbl_importe");

    var table = document.getElementById("tbl_productos");
    var tData = table.DataArray;
    var tEvents = table.EdiTable.Const.Events;

    btnAddRow.addEventListener("click", () => { table.AddRow(); });
    btnDelRow.addEventListener("click", () => { table.DeleteCurrentRow(); });
    table.setInputKey("edt_codigo",ikProducto);
    table.setInputKey("edt_descripcion", ikProducto);

    function trigger(element,event) {
        if (element) {
            let e = new Event(event);
            element.dispatchEvent(e);
        }
    }

    function show_error(text,removeIn=0) {
        if (removeIn <= 0) removeIn = 3;

        error_span.textContent = text;
        
        setTimeout(function(){
            error_span.textContent = "";
        }, (removeIn * 1000));
    }

    function round(num, dec=2) {
        var signo = (num >= 0 ? 1 : -1);
        num = num * signo;
        if (dec === 0) return signo * Math.round(num);
        num = num.toString().split('e');
        num = Math.round(+(num[0] + 'e' + (num[1] ? (+num[1] + dec) : dec)));
        num = num.toString().split('e');
        return signo * (num[0] + 'e' + (num[1] ? (+num[1] - dec) : -dec));
    }

    function number_format(value, {moneda = "", decimal = 2}) {
        let options = {}

        if (moneda.trim() != "") 
        {
            options.style = "currency";
            options.currency = moneda;
            options.minimumFractionDigits = decimal;
        }
        else
        {
            value = round(value,decimal);
        }

        let result = new Intl.NumberFormat("en-US", options).format(value);
        return result;
    }

    function sumarImportes() {
        let option = selDivisa.options[selDivisa.selectedIndex];
        let divisa = option.getAttribute("data-codigo").toUpperCase();

        let subtotal = 0;
        let descuento = 0;
        let impuesto = 0;
        let importe = 0;

        for (let i = 0; i < tData.length; i++) {
            const producto = tData[i];
            if (Object.entries(producto ?? {}).length === 0) continue;
            
            subtotal += Number(producto.subtotal);
            descuento += Number(producto.descuentos);
            impuesto += Number(producto.impuestos);
            importe += Number(producto.importe);
        }

        let fmt = {
            moneda: divisa,
            decimal: DECIMAL_PRECISION
        }

        lblSubtotal.textContent = number_format(subtotal,fmt);
        lblDescuento.textContent = number_format(descuento,fmt);
        lblImpuesto.textContent = number_format(impuesto,fmt);
        lblImporte.textContent = number_format(importe,fmt);

        /* let importes = {
            subtotal: subtotal,
            descuento: descuento,
            impuesto: impuesto,
            importe, importe
        }
        return importes */
    }

    function calcularImpuestos(info) {
        let costo = Number(info.precio);
        let cantidad = Number(info.cantidad);
        let descuentos = Number(info.descuentos);
        let i1_tasa = Number(info.i1_tasa);
        let i2_tasa = Number(info.i2_tasa);
        let i3_tasa = Number(info.i3_tasa);
        let i4_tasa = Number(info.i4_tasa);

        let subtotal = Math.mul(costo,cantidad);
        let sub_desc = Math.sub(subtotal,descuentos);
        let impuesto1 = Math.mul(sub_desc,i1_tasa);
        let impuesto2 = Math.mul(sub_desc,i2_tasa);
        let i1_i2 = Math.add(impuesto1,impuesto2);
        let sub_desc_i1_i2 = Math.add(sub_desc,i1_i2);
        let impuesto3 = Math.mul(sub_desc_i1_i2,i3_tasa);
        let impuesto4 = Math.mul(sub_desc_i1_i2,i4_tasa);
        let i3_i4 = Math.add(impuesto3,impuesto4);
        let impuestos = Math.add(i1_i2,i3_i4);
        let total = Math.add(sub_desc,impuestos);

        let importes = {
            costo: costo,
            cantidad: cantidad,
            subtotal: subtotal,
            descuentos: descuentos,
            impuestos: impuestos,
            total: total,
            impuesto1: impuesto1,
            impuesto2: impuesto2,
            impuesto3: impuesto3,
            impuesto4: impuesto4,
        }

        return importes;
    }

    function actualizarProducto(producto, rowIndex) {
        let i = calcularImpuestos(producto);
        let fmt = {
            decimal: DECIMAL_PRECISION
        }

        producto["edt_precio"] = number_format(i.costo,fmt);
        producto["edt_cantidad"] = i.cantidad;
        producto["edt_subtotal"] = number_format(i.subtotal,fmt);
        producto["edt_descuentos"] = number_format(i.descuentos,fmt);
        producto["edt_impuestos"] = number_format(i.impuestos,fmt);
        producto["edt_importe"] = number_format(i.total,fmt);

        producto["precio"] = i.costo;
        producto["cantidad"] = i.cantidad;
        producto["subtotal"] = i.subtotal;
        producto["descuentos"] = i.descuentos;
        producto["impuestos"] = i.impuestos;
        producto["importe"] = i.total;
        producto["costototal"] = i.costo;
        producto["descuento1"] = i.descuentos;
        producto["impuesto1"] = i.impuesto1;
        producto["impuesto2"] = i.impuesto2;
        producto["impuesto3"] = i.impuesto3;
        producto["impuesto4"] = i.impuesto4;

        table.UpdateRow(rowIndex);
        sumarImportes();
    }

    function joinUnidades(...unidades) {
        let obj = {};

        for (let i = 0; i < unidades.length; i++) {
            const u = unidades[i];
            if (typeof u === "string" && u.trim() != "")
                obj[u] = u;
        }

        return JSON.stringify(obj);
    }

    //* ======================================== [ FORM EVENTS ] ========================================

    ikProveedor.addEventListener("change", function(data) {
        if (!data) return;    
        let URL_BUSCAR_PRODUCTO = InduxsoftCrudlModel.UrlReplace(ikProducto.getAttribute("data-source"),data);
        
        selDivisa.value = data.idivisa;
        txtTipoCambio.value = data.tcambio;
        ikProducto.setAttribute("data-source",URL_BUSCAR_PRODUCTO);
    });

    ikProducto.addEventListener("change", function(data) {
        let row = table.CurrentRowIndex();
        if (!tData[row]) tData[row] = {};

        let i = calcularImpuestos(data);
        let list_unidades = joinUnidades(data.unidada,data.unidadb,data.unidadc,data.unidadd,data.unidade);
        
        let producto = 
        {
            // campos visibles en el editable.
            edt_codigo: data.codigo,
            edt_descripcion: data.descripcion,
            edt_unidad: data.unidada,
            edt_precio: i.costo,
            edt_cantidad: i.cantidad,
            edt_subtotal: i.subtotal,
            edt_descuentos: i.descuentos,
            edt_impuestos: i.impuestos,
            edt_importe: i.total,
            edt_notas: "",
            edt_lote: "",
            edt_fcad: "",
            edt_serie: "",

            // campos para el insert.
            cantidad: i.cantidad,
            costototal: i.costo,
            descuento1: i.descuentos,
            descuento2: 0,
            factor: 1,
            impuesto1: i.impuesto1,
            impuesto2: i.impuesto2,
            impuesto3: i.impuesto3,
            impuesto4: i.impuesto4,
            notas: "",
            precio: i.costo,
            status: 1, // cPor_recibir
            tipocambio: data.tipocambio,
            unidad: data.unidada,
            xfacturar: 1.0,
            iproducto: data.sys_pk,

            // campos extras para operaciones.
            subtotal: i.subtotal,
            descuentos: i.descuentos,
            impuestos: i.impuestos,
            importe: i.total,
            i1_tasa: data.i1_tasa,
            i2_tasa: data.i2_tasa,
            i3_tasa: data.i3_tasa,
            i4_tasa: data.i4_tasa,
            unidada: data.unidada,
            unidadb: data.unidadb,
            unidadc: data.unidadc,
            unidadd: data.unidadd,
            unidade: data.unidade,
            factorb: data.factorb,
            factorc: data.factorc,
            factord: data.factord,
            factore: data.factore,
            lunidades: list_unidades,
        }
        tData[row] = producto;

        table.UpdateRow(row);
        table.NavTo(row,2);
        sumarImportes();
    });

    selDocumento.addEventListener("change", function() {
        // let option = selDocumento.options[selDocumento.selectedIndex];
        let idocumento = Number(selDocumento.value);
        let statusadministrativo = txt_statusadministrativo.value;

        let show_btn_guardar = false;
        let show_btn_cerrar = false;
        let show_btn_reabrir = false;
        let show_btn_procesar = false;
        let show_btn_cancelar = false;

        switch (idocumento) {
            case cCOTIZACION:
                // console.log(idocumento, "cCOTIZACION");
                if (statusadministrativo === "")
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cNO_APLICA)
                {
                    show_btn_guardar = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cABIERTO)
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cCERRADO)
                {
                    show_btn_reabrir = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cPROCESADO)
                {
                    show_btn_cancelar = true;
                }
                break;
            case cPEDIDO:
                // console.log(idocumento, "cPEDIDO");
                if (statusadministrativo === "")
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cNO_APLICA){}
                else if (statusadministrativo == EDO_ADMIN.cABIERTO)
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cCERRADO)
                {
                    show_btn_reabrir = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cPROCESADO)
                {
                    show_btn_cancelar = true;
                }
                break;
            case cREMISION:
                // console.log(idocumento, "cREMISION");
                if (statusadministrativo === "")
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_procesar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cNO_APLICA){}
                else if (statusadministrativo == EDO_ADMIN.cABIERTO)
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_procesar = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cCERRADO)
                {
                    show_btn_reabrir = true;
                    show_btn_procesar = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cPROCESADO)
                {
                    show_btn_cancelar = true;
                }
                break;
            case cFACTURA:
                // console.log(idocumento, "cFACTURA");
                if (statusadministrativo === "")
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_procesar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cNO_APLICA){}
                else if (statusadministrativo == EDO_ADMIN.cABIERTO)
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_procesar = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cCERRADO)
                {
                    show_btn_reabrir = true;
                    show_btn_procesar = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cPROCESADO)
                {
                    show_btn_cancelar = true;
                }
                break;
            case cNOTA_DE_CREDITO:
                // console.log(idocumento, "cNOTA_DE_CREDITO");
                if (statusadministrativo === "")
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_procesar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cNO_APLICA){}
                else if (statusadministrativo == EDO_ADMIN.cABIERTO)
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_procesar = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cCERRADO)
                {
                    show_btn_reabrir = true;
                    show_btn_procesar = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cPROCESADO)
                {
                    show_btn_cancelar = true;
                }
                break;
        
            default:
                console.log(idocumento, "cDESCONOCIDO");
                break;
        }

        btnGuardarDoc.classList.toggle("d-none",!show_btn_guardar);
        btnCerrarDoc.classList.toggle("d-none",!show_btn_cerrar);
        btnReAbrirDoc.classList.toggle("d-none",!show_btn_reabrir);
        btnProcesarDoc.classList.toggle("d-none",!show_btn_procesar);
        btnCancelarDoc.classList.toggle("d-none",!show_btn_cancelar);
    });
    trigger(selDocumento,"change");

    var lastTipoCambio = 1;
    selDivisa.addEventListener("change", function() {
        let option = selDivisa.options[selDivisa.selectedIndex];
        txtTipoCambio.value = Number(option.getAttribute("data-tcambio"));
        trigger(txtTipoCambio,"change");
    });

    txtTipoCambio.addEventListener("change", function(event) {
        let tcambio = Number(event.target.value);
        if (tcambio <= 0) return;
        if (lastTipoCambio == tcambio) return;
        
        for (let i = 0; i < tData.length; i++) {
            const producto = tData[i];
            if (Object.entries(producto ?? {}).length === 0) continue;

            let precio = Math.mul(producto.precio,lastTipoCambio);
            precio = Math.div(precio,tcambio);
            producto["precio"] = precio;
            producto["tipocambio"] = tcambio;

            actualizarProducto(producto,i);
        }

        lastTipoCambio = tcambio;
    });

    /* formPedido.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!event.target.checkValidity()) return;

        let formData = {}
        let fields = event.target.elements;

        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            if (f.name !== "")
                formData[f.name] = f.value;
        }

        formData._detalle = tData;
        let onSuccess = function(r) {
            if (r.message) { alert(r.message); return false; }
            window.location.href = "./";
        }
        let onFail = null;

        InduxsoftCrudlModel.InvokeService("./",formData,onSuccess,onFail,"POST",false,false,"",false);
    }); */

    /* formPedido.addEventListener("reset", (event) => {
        tData = {};
        window.location.href = DOC_COMPRAS;
    }); */

    btnGuardarDoc.addEventListener("click", function() {
        if (!formPedido.reportValidity()) return;
        txt_statusadministrativo.value = EDO_ADMIN.cABIERTO;
        let _detalle = tData.filter((el) => { return el && (Object.entries(el ?? {}).length > 0); });
        txt_detalle_compra.value = JSON.stringify(_detalle);

        formPedido.submit();
    });

    btnCerrarDoc.addEventListener("click", function() {
        if (!formPedido.reportValidity()) return;
        txt_statusadministrativo.value = EDO_ADMIN.cCERRADO;
        let _detalle = tData.filter((el) => { return el && (Object.entries(el ?? {}).length > 0); });
        txt_detalle_compra.value = JSON.stringify(_detalle);

        formPedido.submit();
    });

    btnReAbrirDoc.addEventListener("click", function() {
        txt_statusadministrativo.value = EDO_ADMIN.cABIERTO;
        let elements = formPedido.elements;

        let fd = new FormData();
        fd.append("sys_pk",elements["sys_pk"].value);
        fd.append("sys_recver",elements["sys_recver"].value);
        fd.append("statusadministrativo",elements["statusadministrativo"].value);

        let onSuccess = function(r) {
            if (r.message) { alert(r.message); return false; }
            window.location.href = "./";
        }
        let onFail = function(r) { alert(r.message) }

        InduxsoftCrudlModel.InvokeService("./",fd,onSuccess,onFail,"PUT",false,false,"",true);
    });

    btnProcesarDoc.addEventListener("click", function() {
        if (!formPedido.reportValidity()) return;
        txt_statusadministrativo.value = EDO_ADMIN.cPROCESADO;
        let _detalle = tData.filter((el) => { return el && (Object.entries(el ?? {}).length > 0); });
        txt_detalle_compra.value = JSON.stringify(_detalle);

        formPedido.submit();
    });

    btnCancelarDoc.addEventListener("click", function() {
        if (!formPedido.reportValidity()) return;
        txt_statusadministrativo.value = EDO_ADMIN.cCANCELADO;
        let _detalle = tData.filter((el) => { return el && (Object.entries(el ?? {}).length > 0); });
        txt_detalle_compra.value = JSON.stringify(_detalle);

        formPedido.submit();
    });

    //* ======================================== [ EDITABLE EVENTS ] ========================================

    var lastRowIndex = -1;
    var lastUnit = "";

    table.Events[tEvents.StartEdition] = function(e) {
        let coldef = e.sender.GetColumnDefOfTd(e.td);
        let currentRowIndex = table.CurrentRowIndex();
        let producto = tData[currentRowIndex];

        if (Object.entries(producto ?? {}).length === 0) return;
        if (coldef.field == "edt_unidad" && lastRowIndex != currentRowIndex)
        {
            lastRowIndex = currentRowIndex;
            if (!producto.lunidades) {
                producto["lunidades"] = joinUnidades(producto.unidada,producto.unidadb,producto.unidadc,producto.unidadd,producto.unidade);
            }
            coldef.options = JSON.parse(producto.lunidades);
        }
    }

    table.Events[tEvents.BeforeUpdateCell] = function(e) {
        let currentRowIndex = e.sender.RowIndexOfTd(e.td);
        let field = e.coldef.field;
        let producto = tData[currentRowIndex];

        if (Object.entries(producto ?? {}).length === 0) return;
        if (field == "edt_unidad" && e.text.trim() == "") { show_error("Debe elegir una opción."); e.cancel = true; return false; }
        if ((field == "edt_precio" || field == "edt_cantidad") && Number(e.text.trim()) <= 0) { show_error("El valor debe ser mayor que 0."); e.cancel = true; return false; }
        if (field == "edt_descuentos" && Number(e.text.trim()) < 0) { show_error("El valor no puede ser menor que 0."); e.cancel = true; return false; }
    }

    table.Events[tEvents.ConfirmEdition] = function(e) {
        let currentRowIndex = e.sender.RowIndexOfTd(e.td);
        let field = e.coldef.field;
        let producto = tData[currentRowIndex];
        
        if (Object.entries(producto ?? {}).length === 0) return;
        lastUnit = producto.unidad;

        if (field == "edt_unidad") {
            producto["unidad"] = e.text;

            switch (e.text) {
                case producto.unidada:
                    if (lastUnit == producto.unidada) return;

                    let precioA = 0;
                    if (lastUnit == producto.unidadb) precioA = Math.div(producto.precio,producto.factorb);
                    else if (lastUnit == producto.unidadc) precioA = Math.div(producto.precio,producto.factorc);
                    else if (lastUnit == producto.unidadd) precioA = Math.div(producto.precio,producto.factord);
                    else if (lastUnit == producto.unidade) precioA = Math.div(producto.precio,producto.factore);
                    
                    producto["precio"] = precioA;
                    producto["factor"] = 1; // factora
                    lastUnit = producto.unidada;

                    actualizarProducto(producto,currentRowIndex);
                    break;
                case producto.unidadb:
                    if (lastUnit == producto.unidadb) return;

                    let precioB = 0;
                    if (lastUnit == producto.unidada) precioB = Math.mul(producto.precio,producto.factorb);
                    else if (lastUnit == producto.unidadc) {
                        let x = Math.mul(producto.factorb,producto.precio);
                        precioB = Math.div(x,producto.factorc);
                    }
                    else if (lastUnit == producto.unidadd) {
                        let x = Math.mul(producto.factorb,producto.precio);
                        precioB = Math.div(x,producto.factord);
                    }
                    else if (lastUnit == producto.unidade) {
                        let x = Math.mul(producto.factorb,producto.precio);
                        precioB = Math.div(x,producto.factore);
                    }

                    producto["precio"] = precioB;
                    producto["factor"] = producto.factorb;
                    lastUnit = producto.unidadb;

                    actualizarProducto(producto,currentRowIndex);
                    break;
                case producto.unidadc:
                    if (lastUnit == producto.unidadc) return;
                    
                    let precioC = 0;
                    if (lastUnit == producto.unidada) precioC = Math.mul(producto.precio,producto.factorc);
                    else if (lastUnit == producto.unidadb) {
                        let x = Math.mul(producto.factorc,producto.precio);
                        precioC = Math.div(x,producto.factorb);
                    }
                    else if (lastUnit == producto.unidadd) {
                        let x = Math.mul(producto.factorc,producto.precio);
                        precioC = Math.div(x,producto.factord);
                    }
                    else if (lastUnit == producto.unidade) {
                        let x = Math.mul(producto.factorc,producto.precio);
                        precioC = Math.div(x,producto.factore);
                    }

                    producto["precio"] = precioC;
                    producto["factor"] = producto.factorc;
                    lastUnit = producto.unidadc;

                    actualizarProducto(producto,currentRowIndex);
                    break;
                case producto.unidadd:
                    if (lastUnit == producto.unidadd) return;
                    
                    let precioD = 0;
                    if (lastUnit == producto.unidada) precioD = Math.mul(producto.precio,producto.factord);
                    else if (lastUnit == producto.unidadb) {
                        let x = Math.mul(producto.factord,producto.precio);
                        precioD = Math.div(x,producto.factorb);
                    }
                    else if (lastUnit == producto.unidadc) {
                        let x = Math.mul(producto.factord,producto.precio);
                        precioD = Math.div(x,producto.factorc);
                    }
                    else if (lastUnit == producto.unidade) {
                        let x = Math.mul(producto.factord,producto.precio);
                        precioD = Math.div(x,producto.factore);
                    }
                    
                    producto["precio"] = precioD;
                    producto["factor"] = producto.factord;
                    lastUnit = producto.unidadd;

                    actualizarProducto(producto,currentRowIndex);
                    break;
                case producto.unidade:
                    if (lastUnit == producto.unidade) return;
                    
                    let precioE = 0;
                    if (lastUnit == producto.unidada) precioE = Math.mul(producto.precio,producto.factore);
                    else if (lastUnit == producto.unidadb) {
                        let x = Math.mul(producto.factore,producto.precio);
                        precioE = Math.div(x,producto.factorb);
                    }
                    else if (lastUnit == producto.unidadc) {
                        let x = Math.mul(producto.factore,producto.precio);
                        precioE = Math.div(x,producto.factorc);
                    }
                    else if (lastUnit == producto.unidadd) {
                        let x = Math.mul(producto.factore,producto.precio);
                        precioE = Math.div(x,producto.factord);
                    }

                    producto["precio"] = precioE;
                    producto["factor"] = producto.factore;
                    lastUnit = producto.unidade;

                    actualizarProducto(producto,currentRowIndex);
                    break;

                default:
                    show_error("Unidad: " + e.text + " no se encuentra en el diccionario.");
                    break;
            }
        }

        if (["edt_precio","edt_cantidad","edt_descuentos"].includes(field))
        {
            let value = Number(e.text.trim());
            producto[field] = value;
            if (field == "edt_precio") producto["precio"] = value;
            if (field == "edt_cantidad") producto["cantidad"] = value;
            if (field == "edt_descuentos") producto["descuentos"] = value;
            actualizarProducto(producto,currentRowIndex);
        }

        if (field == "edt_notas") {
            producto["notas"] = e.text.trim();
            table.UpdateRow(currentRowIndex);
        }
    }
});