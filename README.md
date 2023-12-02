Incluir las siguientes dependencias dentro del render.dk (crear si no existe) ubicado dentro de _protected:
 - Bootstrap 5
 - induxsoft.controls.js
 - induxsoft.controls.editable.js
 - induxsoft.crudl.model.js
 - induxsoft.math.js

En nuestro render.dk añadir despues de nuestros #includes
 - if not(contains(@@(@http_context,"$request/headers/http_accept"),"html")) { return }

Incluir las siguientes lineas en routes.map (crear si no existe) ubicado dentro de _protected

 - *: /compras/{_program}/{_entity_id}/{_view}/ > $compras/entry-point.dkl
 - *: /compras/{_program}/{_entity_id?} > $compras/entry-point.dkl
 - *: /compras/ > $compras/index.dkl

Colocar al final solo si aun no se cuenta con el map: `*: / > $webshell/index.dkl`