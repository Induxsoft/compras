document.addEventListener("DOMContentLoaded", () => 
{
    let error_span = document.getElementById("err-msg");
    let mainActionBar = document.getElementById("main_action_bar");
    let btnGuardarDoc = document.getElementById("btn-guardar");
    let btnCerrarDoc = document.getElementById("btn-cerrar");
    let btnProcesarDoc = document.getElementById("btn-procesar");
    let btnCancelarDoc = document.getElementById("btn-cancelar");
    let btnReAbrirDoc = document.getElementById("btn-reabrir");
    let btnAddDoc = document.getElementById('btn-add-doc');
    let btnFacturar = document.getElementById('btn-facturar');
    let btnProcesarText = document.getElementById('btn-procesar-text');

    let formPedido = document.getElementById("form_pedido");
    let ikProveedor = document.getElementById("sel_proveedor");
    let ikProducto = document.getElementById("sel_producto");
    let ikDocInsert = document.getElementById("sel_doc_insert");
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
    var tColdef = JSON.parse(JSON.stringify(table.Columns));

    const convertir_a =
    {
        divisa_documento:1,
        divisa_producto:2
    }

    btnAddRow.addEventListener("click", () => { table.AddRow(); });
    btnDelRow.addEventListener("click", () => { table.DeleteCurrentRow(); toggleColumns(); });
    table.setInputKey("codigo",ikProducto);
    table.setInputKey("descripcion", ikProducto);

    table.onTdPaint = (td,idxRow,idxCol,field) => { colorearTabla(td,idxRow,idxCol,field) }
    
    sumarImportes();
    toggleColumns();
    updateCotizados();
    table._printRows();
    if (ikProveedor && Object.keys(ikProveedor.getValue()).length > 0) changeURLImport(ikProveedor.getValue());

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

    function desactivar_botones(v)
    {
        if (btnGuardarDoc) btnGuardarDoc.disabled = v;
        if (btnCerrarDoc) btnCerrarDoc.disabled = v;
        if (btnProcesarDoc) btnProcesarDoc.disabled = v;
        if (btnCancelarDoc) btnCancelarDoc.disabled = v;
        if (btnReAbrirDoc) btnReAbrirDoc.disabled = v;
        if (btnFacturar) btnFacturar.disabled = v;
    }

    function number_format(value, {moneda = "", decimal = 2}) {
        let options = {}

        if (moneda.trim() != "") 
        {
            options.style = "currency";
            options.currency = moneda;
            options.minimumFractionDigits = decimal;
            options.maximumFractionDigits = decimal;
        }
        else
        {
            value = round(value,decimal);
        }

        let langcode = (new Intl.NumberFormat()).resolvedOptions().locale;
        let result = new Intl.NumberFormat(langcode, options).format(value);
        
        return result;
    }

    function sumarImportes() {
        let subtotal = 0, descuentos = 0, impuestos = 0, total = 0;

        for (let i = 0; i < tData.length; i++) {
            const producto = tData[i];
            if (Object.entries(producto ?? {}).length === 0) continue;
            
            subtotal = Math.add(subtotal,Number(producto.subtotal));
            descuentos = Math.add(descuentos,Number(producto.descuentos));
            impuestos = Math.add(impuestos,Number(producto.impuestos));
            total = Math.add(total,Number(producto.importe));
        }

        let option = selDivisa.options[selDivisa.selectedIndex];
        let divisa = option.getAttribute("data-codigo").toUpperCase();

        let fmt = {moneda: divisa, decimal: DECIMAL_PRECISION};

        lblSubtotal.textContent = number_format(subtotal,fmt);
        lblDescuento.textContent = number_format(descuentos,fmt);
        lblImpuesto.textContent = number_format(impuestos,fmt);
        lblImporte.textContent = number_format(total,fmt);
    }

    function convertir(value,tcprd,tcdoc,mode) {
        if (mode === convertir_a.divisa_documento) {
            return Math.RoundTo(Math.div(Math.mul(value,tcprd),tcdoc),8)
        }
        if (mode === convertir_a.divisa_producto) {
            return Math.RoundTo(Math.div(Math.mul(value,tcdoc),tcprd),8)
        }
        
        return 0;
    }

    function calcularImpuestos(info) {
        let tc_doc = Number(txtTipoCambio.value);
        let tc_prd = Number(info.tipocambio);
        let precio = Number(info?._precio ?? info.precio);
        
        let costo = convertir(precio,tc_prd,tc_doc,convertir_a.divisa_documento);
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
    function validarReqLoteSerie(detalle) {
        let ok = true;
        if (!detalle) return ok;

        detalle.forEach(d=>{
            if (!compras_lotes_inhab && ok && Number(d.reqlote??0) && (d.lote??'').trim() == ''){
                ok = false;
                alert(`No se puede continuar, el producto: ${d.codigo}-${d.descripcion} requiere un número de lote`);
            }
            if (!compras_series_inhab && ok && Number(d.reqserie??0) && (d.serie??'').trim() == ''){
                ok = false;
                alert(`No se puede continuar, el producto: ${d.codigo}-${d.descripcion} requiere un número de serie`);
            }
        });
        return ok;
    }
    function setURLInsertDoc(currentDoc)
    {
        let URL_BUSCAR_DOCUMENT = InduxsoftCrudlModel.UrlReplace(ikDocInsert.getAttribute("data-source"),{ current:currentDoc });
        ikDocInsert.setAttribute("data-source",URL_BUSCAR_DOCUMENT);
    }
    function getDetalleFromDoc(doc)
    {
        const url = url_detalle_doc.replace('@doc',doc);
        InduxsoftCrudlModel.InvokeService(url, null,
            success => { 
                success.forEach(prod => { 
                    if (detalleNoRepetido(prod)) {
                        updateCotizado(prod);
                        agregarProducto(prod,false);
                    }
                });
                sumarImportes();
                table._printRows();
            },
            failure => { alert(failure.message??JSON.stringify(failure)) },
            "GET", false
        );
    }
    function detalleNoRepetido(detalle)
    {
        return (tData.find(d => d.doc_partida == detalle.doc_partida) === undefined);
    }
    function agregarProducto(data,currentRow=true)
    {
        if (!data) return;

        let i = calcularImpuestos(data);
        let list_unidades = joinUnidades(data.unidada,data.unidadb,data.unidadc,data.unidadd,data.unidade);
        
        let producto = 
        {
            // campos visibles en el editable.
            codigo: data.codigo,
            descripcion: data.descripcion,
            unidad: data.unidada,
            precio: i.costo,
            cantidad: i.cantidad,
            origen: (data.origen??''),
            cotizado: (data.cotizado??''),
            subtotal: i.subtotal,
            descuentos: i.descuentos,
            impuestos: i.impuestos,
            importe: i.total,
            notas: "",
            lote: "",
            fcad: "",
            serie: "",

            // campos para el insert.
            costototal: i.costo,
            descuento1: i.descuentos,
            descuento2: 0,
            factor: 1,
            impuesto1: i.impuesto1,
            impuesto2: i.impuesto2,
            impuesto3: i.impuesto3,
            impuesto4: i.impuesto4,
            status: 1, // cPor_recibir
            tipocambio: data.tipocambio,
            xfacturar: 1.0,
            iproducto: data.sys_pk,
            doc_partida: (data.doc_partida??null),
            documento: (data.documento??null),

            // campos extras para operaciones.
            _precio: data.precio,
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
            reqlote: data.reqlote,
            reqserie: data.reqserie,
            doc_partida: (data.doc_partida??null),
            pendientes: data.pendientes,
            minimo: (data.minimo??0),
            usado: (data.minimo??0),
            cantidad_constante: (data.cantidad_constante??0)
        }
        let row = 0;
        if (currentRow)
        {
            row = table.CurrentRowIndex();
            if (!tData[row]) tData[row] = {};
            tData[row] = producto;
        }
        else
        {
            tData.unshift(producto);
        }
        toggleColumns();
        //table.UpdateRow(row);
        disableSelDivisa(true);
    }
    function colorearTabla(td,idxRow,idxCol,field)
    {
        let obj = tData[idxRow];
        if (obj && obj.doc_partida)
        {
            td.style.backgroundColor = '#888';
            td.style.color = '#FFF';
        }
    }
    function toggleColumns()
    {
        const showColumns = tData.find(r => (r.origen??'') != '');
        table.hideColumn('origen', !showColumns);
        table.hideColumn('cotizado', !showColumns);
    }
    function changeURLImport(data)
    {
        let URL_BUSCAR_PRODUCTO = InduxsoftCrudlModel.UrlReplace(ikProducto.getAttribute("data-source"),data);
        let URL_BUSCAR_DOCUMENT = InduxsoftCrudlModel.UrlReplace(ikDocInsert.getAttribute("data-source"),{ proveedor:data.sys_pk });
        
        txtTipoCambio.value = data.tcambio;
        ikProducto.setAttribute("data-source",URL_BUSCAR_PRODUCTO);
        ikDocInsert.setAttribute("data-source",URL_BUSCAR_DOCUMENT);
    }
    function showControlsByStatus()
    {
        if (EDO_ENTREGA == 3 && EDO_FACTURACION == 3)
        {
            btnProcesarDoc.classList.add("d-none");
            btnCancelarDoc.classList.add("d-none");
            btnFacturar.classList.add('d-none');
        }
    }
    function validarDetalle(detalle)
    {
        let ok = true;
        if (!detalle) return ok;

        const bad_product = detalle.find(d => Number(d.precio) <= 0);
        if (bad_product){
            ok = false;
            alert("El precio del producto: " + bad_product.descripcion + " debe ser mayor a cero.");
        }
        return ok;
    }
    function updateCotizados()
    {
        if (init_insert) tData.forEach(d=>updateCotizado(d));
    }
    function updateCotizado(producto)
    {
        if (producto.cotizado)
        {
            producto.cotizado = (producto.usado + producto.cantidad) + "/" + producto.cantidad_constante;
        }
    }
    
    sel_divisa_disable = false;
    function disableSelDivisa(v)
    {
        if (sel_divisa_disable === v) return;
        selDivisa.toggleAttribute("readonly",v);
        sel_divisa_disable = v;
    }
    disableSelDivisa((filterData().length > 0));

    //* ======================================== [ FORM EVENTS ] ========================================

    ikProveedor.addEventListener("change", function(data) {
        if (!data) return;
        changeURLImport(data);
        selDivisa.value = data.idivisa;
    });

    ikProducto.addEventListener("change", function(data) {
        ikProducto.accept_data = null;
        ikProducto.record_selected = null;
        if (!data) return;
        
        let row = table.CurrentRowIndex();
        agregarProducto(data);
        table._printRows();
        table.NavTo(row,2);
        sumarImportes();
    });

    ikProducto.onBeforeSearch = function(surl) {
        let dtPdr = ikProveedor.getValue();
        let zimpuesto = Number(dtPdr?.zimpuesto??1);
        let idivisa = Number(selDivisa.value);
        
        let url = surl.replace("@zimpuesto",zimpuesto);
        url = InduxsoftCrudlModel.UrlAddParameter(url,"idivisa",idivisa);
        return url;
    }

    ikDocInsert.addEventListener('change', function(data) {
        if (!data) return;
        getDetalleFromDoc(data.sys_pk)
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
        let show_btn_insert_doc = false;
        let show_btn_facturar = false;
        btnProcText = "Procesar";

        setURLInsertDoc(idocumento);

        switch (idocumento) {
            case cCOTIZACION:
                // console.log(idocumento, "cCOTIZACION");
                show_btn_procesar = true;
                btnProcText = "Hacer pedido";
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
                show_btn_procesar = true;
                table.changeColumnTitle("cotizado","Cotizado");
                // console.log(idocumento, "cPEDIDO");
                if (statusadministrativo === "")
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_insert_doc = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cNO_APLICA){}
                else if (statusadministrativo == EDO_ADMIN.cABIERTO)
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_cancelar = true;
                    show_btn_insert_doc = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cCERRADO)
                {
                    show_btn_reabrir = true;
                    show_btn_cancelar = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cPROCESADO)
                {
                    show_btn_cancelar = true;
                    btnProcText = "Recibir";
                }
                break;
            case cREMISION:
                table.changeColumnTitle("cotizado","Pedido");
                // console.log(idocumento, "cREMISION");
                if (statusadministrativo === "")
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_procesar = true;
                    show_btn_insert_doc = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cNO_APLICA){}
                else if (statusadministrativo == EDO_ADMIN.cABIERTO)
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_procesar = true;
                    show_btn_cancelar = true;
                    show_btn_insert_doc = true;
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
                    show_btn_facturar = true;
                }
                break;
            case cFACTURA:
                table.changeColumnTitle("cotizado","Recibido");
                // console.log(idocumento, "cFACTURA");
                if (statusadministrativo === "")
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_procesar = true;
                    show_btn_insert_doc = true;
                }
                else if (statusadministrativo == EDO_ADMIN.cNO_APLICA){}
                else if (statusadministrativo == EDO_ADMIN.cABIERTO)
                {
                    show_btn_guardar = true;
                    show_btn_cerrar = true;
                    show_btn_procesar = true;
                    show_btn_cancelar = true;
                    show_btn_insert_doc = true;
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
        btnAddDoc.classList.toggle('d-none',!show_btn_insert_doc);
        btnFacturar.classList.toggle('d-none',!show_btn_facturar);
        btnProcesarText.textContent = btnProcText;
        showControlsByStatus();
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
        let _detalle = filterData()
        if (!validarReqLoteSerie(_detalle)) return;
        if (!validarDetalle(_detalle)) return;
        txt_detalle_compra.value = JSON.stringify(_detalle);

        desactivar_botones(true);
        formPedido.submit();
    });

    btnCerrarDoc.addEventListener("click", function() {
        if (!formPedido.reportValidity()) return;
        txt_statusadministrativo.value = EDO_ADMIN.cCERRADO;
        let _detalle = filterData()
        if (!validarReqLoteSerie(_detalle)) return;
        txt_detalle_compra.value = JSON.stringify(_detalle);

        desactivar_botones(true);
        formPedido.submit();
    });

    btnReAbrirDoc.addEventListener("click", function() {
        txt_statusadministrativo.value = EDO_ADMIN.cABIERTO;
        let elements = formPedido.elements;

        desactivar_botones(true);

        let fd = new FormData();
        fd.append("sys_pk",elements["sys_pk"].value);
        fd.append("sys_recver",elements["sys_recver"].value);
        fd.append("statusadministrativo",elements["statusadministrativo"].value);

        let onSuccess = function(r) {
            if (r.message) { alert(r.message); return false; }
            window.location.href = "./";
        }
        let onFail = function(r) {
            alert(r.message);
            desactivar_botones(false);
        }

        InduxsoftCrudlModel.InvokeService("./",fd,onSuccess,onFail,"PUT",false,false,"",true);
    });

    btnProcesarDoc.addEventListener("click", function() {
        if (!formPedido.reportValidity()) return;
        txt_statusadministrativo.value = EDO_ADMIN.cPROCESADO;
        if (btnProcesarText.textContent == 'Recibir') txt_statusadministrativo.value = EDO_ADMIN.Recibir;
        let _detalle = filterData()
        if (!validarReqLoteSerie(_detalle)) return;
        if (!validarDetalle(_detalle)) return;
        txt_detalle_compra.value = JSON.stringify(_detalle);

        desactivar_botones(true);
        formPedido.submit();
    });

    btnFacturar.addEventListener("click", function(){
        if (!formPedido.reportValidity()) return;
        txt_statusadministrativo.value = EDO_ADMIN.Facturado;
        let _detalle = filterData()
        if (!validarDetalle(_detalle)) return;
        txt_detalle_compra.value = JSON.stringify(_detalle);
        desactivar_botones(true);
        formPedido.submit();
    });

    btnCancelarDoc.addEventListener("click", function() {
        if (!formPedido.reportValidity()) return;
        txt_statusadministrativo.value = EDO_ADMIN.cCANCELADO;
        let _detalle = filterData()
        txt_detalle_compra.value = JSON.stringify(_detalle);

        desactivar_botones(true);
        formPedido.submit();
    });

    btnAddDoc.addEventListener("click", function() {
        if (ikProveedor.getValue().sys_pk == undefined){
            alert("Debe seleccionar un proveedor para continuar");
            return;
        }
        ikDocInsert.searchText("", false);
    });

    //* ======================================== [ EDITABLE EVENTS ] ========================================

    var lastRowIndex = -1;
    var lastUnit = "";

    function filterData() {
        return (table?.DataArray??[]).filter(row => Object.keys(row??{}).length >= (table?.Columns??[]).length);
    }

    table.Events[tEvents.RowDeleted] = function(e) {
        disableSelDivisa((filterData().length > 0));
    }

    table.Events[tEvents.EnterCell] = function(e) {
        let coldef = e.sender.GetColumnDefOfTd(e.td);
        let field = coldef.field;

        if (!["lote","fcad","serie"].includes(field)) return;

        let curr_row = table.RowIndexOfTd(e.td);
        let curr_col = table.ColIndexOfTd(e.td);
        let data_row = table.DataArray[curr_row];

        // Deshabilitar edición a las celdas de lote, caducidad y serie si el producto no lo requiere.
        if ((field === "lote" || field === "fcad") && !data_row.reqlote) table.Columns[curr_col].type = "NoEditable";
        else if (field === "serie" && !data_row.reqserie) table.Columns[curr_col].type = "NoEditable";
        else table.Columns[curr_col].type = tColdef[curr_col].type;
    }

    table.Events[tEvents.StartEdition] = function(e) {
        let coldef = e.sender.GetColumnDefOfTd(e.td);
        let currentRowIndex = table.CurrentRowIndex();
        let producto = tData[currentRowIndex];

        if (Object.entries(producto ?? {}).length === 0) return;
        if (coldef.field == "unidad" && lastRowIndex != currentRowIndex)
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
        if (field == "unidad" && e.text.trim() == "") { show_error("Debe elegir una opción."); e.cancel = true; return false; }
        if ((field == "precio" || field == "cantidad") && Number(e.text.trim()) <= 0) { show_error("El valor debe ser mayor que 0."); e.cancel = true; return false; }
        if (field == "descuentos" && Number(e.text.trim()) < 0) { show_error("El valor no puede ser menor que 0."); e.cancel = true; return false; }
    }

    table.Events[tEvents.ConfirmEdition] = function(e) {
        let currentRowIndex = e.sender.RowIndexOfTd(e.td);
        let field = e.coldef.field;
        let producto = tData[currentRowIndex];
        
        if (Object.entries(producto ?? {}).length === 0) return;
        let actualizar_importes = false;

        if (["precio","cantidad","descuentos"].includes(field))
        {
            let value = Number(e.text.trim());
            producto[field] = value;
            if (field == "precio") producto["precio"] = value;
            if (field == "cantidad"){
                let idocumento = Number(selDocumento.value);
                producto["cantidad"] = value;
                if ((idocumento == cREMISION || idocumento == cFACTURA) && producto.origen && producto.cantidad > producto.pendientes) {
                    alert(`No se puede ${(idocumento==cREMISION?'recibir':'facturar')} más de la cantidad ${(idocumento==cREMISION?'pedida':'recibida')}`);
                    producto["cantidad"] = producto.pendientes;
                    e.text = producto.pendientes;
                }
                if (producto.reqserie && producto.cantidad > 1){
                    alert('La cantidad para este producto con serie requerida debe ser 1, para agregar más series del mismo producto insertelo en una nueva fila');
                    producto["cantidad"] = 1;
                    e.text = 1;
                }
                if (producto.cantidad < producto.minimo) {
                    alert('El producto de este documento a sido insertado en otro documento por lo que no puede establecer una cantidad inferior a: ' + producto.minimo);
                    producto["cantidad"] = producto.minimo;
                    e.text = producto.minimo;
                }
                updateCotizado(producto);
            }
            if (field == "descuentos") producto["descuentos"] = value;
            actualizar_importes = true;
        }
        
        lastUnit = producto.unidad;
        if (field == "unidad")
        {
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

                    actualizar_importes = true;
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

                    actualizar_importes = true;
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

                    actualizar_importes = true;
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

                    actualizar_importes = true;
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

                    actualizar_importes = true;
                    break;

                default:
                    show_error("Unidad: " + e.text + " no se encuentra en el diccionario.");
                    break;
            }
        }

        if (field == "notas") producto["notas"] = e.text.trim();

        if (actualizar_importes)
        {
            let tc_doc = Number(txtTipoCambio.value);
            let tc_prd = Number(producto.tipocambio);
            let precio = Number(producto.precio);

            producto["_precio"] = convertir(precio,tc_prd,tc_doc,convertir_a.divisa_producto);

            actualizarProducto(producto,currentRowIndex);
        }
        else table.UpdateRow(currentRowIndex);
    }
});