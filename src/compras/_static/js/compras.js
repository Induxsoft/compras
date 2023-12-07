document.addEventListener("DOMContentLoaded", () => 
{
    let error_span = document.getElementById("err-msg");
    let ikProveedor = document.getElementById("sel_proveedor");
    let ikProducto = document.getElementById("sel_producto");
    let formPedido = document.getElementById("form_pedido");
    let selDivisa = document.getElementById("sel_divisa");
    let txtTipoCambio = document.getElementById("txt_tipocambio");
    let lblSubtotal = document.getElementById("lbl_subtotal");
    let lblDescuento = document.getElementById("lbl_descuento");
    let lblImpuesto = document.getElementById("lbl_impuesto");
    let lblImporte = document.getElementById("lbl_importe");

    var table = document.getElementById("tbl_productos");
    var tData = table.DataArray;
    var tEvents = table.EdiTable.Const.Events;

    let btnAddRow = document.getElementById("btn-add-row");
    let btnDelRow = document.getElementById("btn-del-row");

    btnAddRow.addEventListener("click", () => { table.AddRow(); });
    btnDelRow.addEventListener("click", () => { table.DeleteCurrentRow(); });
    table.setInputKey("codigo",ikProducto);
    table.setInputKey("descripcion", ikProducto);

    function trigger(element,event) {
        if (element) {
            let e = new Event(event);
            element.dispatchEvent(e);
        }
    }

    function show_error (text,removeIn=0) {
        if (removeIn <= 0) removeIn = 3;

        error_span.textContent = text;
        
        setTimeout(function(){
            error_span.textContent = "";
        }, (removeIn * 1000));
    }

    function number_format(val, tipo = "number", moneda = "MXN") {
        let formatter = new Intl.NumberFormat("en");
        let tmonedas = ["moneda", "currency", "dinero", "money"];

        if (tmonedas.includes(tipo)) {
            let options = {
                style: "currency",
                minimumFractionDigits: 2,
                currency: moneda
            }
            
            formatter = new Intl.NumberFormat("en-US", options);
        }

        return formatter.format(val);
    }

    function sumarImportes() {
        let option = selDivisa.options[selDivisa.selectedIndex];
        let moneda = option.getAttribute("data-codigo").toUpperCase();

        let subtotal = 0;
        let descuento = 0;
        let impuesto = 0;
        let importe = 0;

        for (let i = 0; i < tData.length; i++) {
            const producto = tData[i];
            if (!producto) continue;
            
            subtotal += Number(producto.subtotal);
            descuento += Number(producto.descuentos);
            impuesto += Number(producto.impuestos);
            importe += Number(producto.importe);
        }

        lblSubtotal.textContent = number_format(subtotal,"money",moneda);
        lblDescuento.textContent = number_format(descuento,"money",moneda);
        lblImpuesto.textContent = number_format(impuesto,"money",moneda);
        lblImporte.textContent = number_format(importe,"money",moneda);

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

        producto["precio"] = i.costo;
        producto["cantidad"] = i.cantidad;
        producto["subtotal"] = i.subtotal;
        producto["descuentos"] = i.descuentos;
        producto["impuestos"] = i.impuestos;
        producto["importe"] = i.total;
        producto["impuesto1"] = i.impuesto1;
        producto["impuesto2"] = i.impuesto2;
        producto["impuesto3"] = i.impuesto3;
        producto["impuesto4"] = i.impuesto4;

        table.UpdateRow(rowIndex);
        sumarImportes();
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

        function joinUnidades(...unidades) {
            let obj = {};

            for (let i = 0; i < unidades.length; i++) {
                const u = unidades[i];
                if (typeof u === "string" && u.trim() != "")
                    obj[u] = u;
            }

            return JSON.stringify(obj);
        }

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
            subtotal: i.subtotal,
            descuentos: i.descuentos,
            impuestos: i.impuestos,
            importe: i.total,
            notas: "",

            // campos extras para el insert.
            costototal: i.total,
            descuento1: i.descuentos,
            descuento2: 0,
            factor: data.factorb,
            impuesto1: i.impuesto1,
            impuesto2: i.impuesto2,
            impuesto3: i.impuesto3,
            impuesto4: i.impuesto4,
            status: 1, // cPor_recibir
            tipocambio: data.tipocambio,
            xfacturar: 1.0,
            iproducto: data.sys_pk,

            // campos extras para operaciones.
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
            if (!producto) continue;

            let precio = Math.mul(producto.precio,lastTipoCambio);
            precio = Math.div(precio,tcambio);
            producto["precio"] = precio;

            actualizarProducto(producto,i);
        }

        lastTipoCambio = tcambio;
    });

    formPedido.addEventListener("submit", (event) => {
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
    });

    formPedido.addEventListener("reset", (event) => {
        tData = {};
        window.location.href = DOC_COMPRAS;
    });

    //* ======================================== [ EDITABLE EVENTS ] ========================================

    var lastRowIndex = -1;
    var lastUnit = "";

    table.Events[tEvents.StartEdition] = function(e) {
        let coldef = e.sender.GetColumnDefOfTd(e.td);
        let currentRowIndex = table.CurrentRowIndex();
        let producto = tData[currentRowIndex];

        if (!producto) return;
        if (coldef.field == "unidad" && lastRowIndex != currentRowIndex)
        {
            lastRowIndex = currentRowIndex;
            coldef.options = JSON.parse(producto.lunidades);
        }
    }

    table.Events[tEvents.BeforeUpdateCell] = function(e) {
        let currentRowIndex = e.sender.RowIndexOfTd(e.td);
        let field = e.coldef.field;
        let producto = tData[currentRowIndex];

        if (!producto) return;
        if (field == "unidad" && e.text.trim() == "") { show_error("Debe elegir una opción."); e.cancel = true; return false; }
        if ((field == "precio" || field == "cantidad") && Number(e.text.trim()) <= 0) { show_error("El valor debe ser mayor que 0."); e.cancel = true; return false; }
        if (field == "descuentos" && Number(e.text.trim()) < 0) { show_error("El valor no puede ser menor que 0."); e.cancel = true; return false; }
    }

    table.Events[tEvents.ConfirmEdition] = function(e) {
        let currentRowIndex = e.sender.RowIndexOfTd(e.td);
        let field = e.coldef.field;
        let producto = tData[currentRowIndex];
        
        if (!producto) return;
        lastUnit = producto.unidad;

        if (field == "unidad") {
            switch (e.text) {
                case producto.unidada:
                    if (lastUnit == producto.unidada) return;

                    let precioA = 0;
                    if (lastUnit == producto.unidadb) precioA = Math.div(producto.precio,producto.factorb);
                    else if (lastUnit == producto.unidadc) precioA = Math.div(producto.precio,producto.factorc);
                    else if (lastUnit == producto.unidadd) precioA = Math.div(producto.precio,producto.factord);
                    else if (lastUnit == producto.unidade) precioA = Math.div(producto.precio,producto.factore);
                    
                    producto["precio"] = precioA;
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
                    lastUnit = producto.unidade;

                    actualizarProducto(producto,currentRowIndex);
                    break;

                default:
                    show_error("Unidad: " + e.text + " no se encuentra en el diccionario.");
                    break;
            }
        }

        if (["precio","cantidad","descuentos"].includes(field))
        {
            producto[field] = Number(e.text.trim());
            actualizarProducto(producto,currentRowIndex);
        }
    }
});