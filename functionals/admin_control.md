```
Página: 1 de 54 Edición: 02
```
**ANÁLISIS FUNCIONAL INTAQALAB CONTROL ADMINISTRATIVO**

##### NOMBRE FIRMA Y FECHA

```
PREPARADO POR
Knowmadmood
```
```
REVISADO POR
```
```
Miguel Ángel Orellana Montes de Oca
Jefe del Área de Ensayos de Armamento
Marina Lucena García
Jefa de la Unidad de Planificación y Análisis
```
```
ACEPTADO POR
```
```
Nombre persona que aceptada
Cargo Persona que acepta
```
```
HISTORIA DEL DOCUMENTO
```
```
EDICIÓN FECHA INFORMACIÓN
```
```
01 10/2025 Edición inicial.
```
```
02 01/
```
```
Aclaraciones sobre las pruebas vinculadas. Modificación de la navegación: se accederá a la ejecución de la
prueba desde el menú lateral de la izquierda. Modificación de los permisos para cerrar una prueba y para la
gestión de los días especiales. Modificación del versionado y acceso a la ficha de documentos generales.
```
(^)
INTA posee en propiedad este documento. Las copias de este documento que se suministren no podrán ser utilizadas para fines diferentes
a aquellos para los cuales son facilitadas, ni tampoco podrán ser distribuidas ni reproducidas total o parcialmente sin la autorización previa
del INTA.
Cualquier persona, aparte de las autorizadas, que encuentre este documento, deberá enviarlo a:
**INSTITUTO NACIONAL DE TÉCNICA AEROESPACIAL**
Carretera de Ajalvir, Km. 4
28850 Torrejón de Ardoz
(Madrid)
Si lo tiene que imprimir, recicle el papel una vez lo haya usado


## ÍNDICE


         - Página: 2 de 54 Edición:
- 1 INTRODUCCIÓN
   - 1.1 Objeto
   - 1.2 Alcance
   - 1.3 Abreviaturas
   - 1.4 Definiciones
- 2 DOCUMENTACIÓN.............................................................................................................................................................
   - 2.1 Documentos de requisitos legales
   - 2.2 Documentos aplicables
   - 2.3 Documentos de referencia
- 3 GESTIÓN DE LA PRUEBA.................................................................................................................................................
   - 3.1 Creación de la prueba
   - 3.2 Pestaña de información general de la prueba
   - 3.3 Acciones sobre la prueba
      - 3.3.1 Modificación de una prueba
      - 3.3.2 Cancelación de una prueba
      - 3.3.3 Anulación de una prueba
      - 3.3.4 Eliminación de una prueba
      - 3.3.5 Cierre de una prueba.........................................................................................................................
      - 3.3.6 Reactivación de una prueba
      - 3.3.7 Reapertura de una prueba
- 4 VISUALIZACIÓN Y PROGRAMACIÓN EN EL CALENDARIO
   - 4.1 Estructura general de la pantalla
   - 4.2 Flujo de programación de pruebas
   - 4.3 Gestión de días especiales en el calendario
- 5 GESTIÓN DOCUMENTAL
   - 5.1 Tipos de documentos
   - 5.2 Asignación de documentos a la prueba
   - 5.3 Consulta de documentos
   - 5.4 Ficha del documento
      - 5.4.1 Pestaña ”Documento”
      - 5.4.2 Pestaña ”Versiones”
- 6 PROCESO DE GENERACIÓN DE PRESUPUESTOS
   - 6.1 Criterios de cálculo del presupuesto
   - 6.2 Consideraciones especiales
   - 6.3 Revisión y modificaciones del presupuesto
   - 6.4 Integración con SAP..........................................................................................................................................
- 7 PRUEBAS DE FUEGO
   - 7.1 Estados de una prueba
         - Página: 3 de 54 Edición:
   - 7.2 Campos de Pruebas de Fuego
   - 7.3 Cálculo de fechas límite
   - 7.4 Indicadores visuales para fechas límite y fechas reales
   - 7.5 Filtros
- 8 RESPONSABILIDAD
- 9 DIAGRAMA DE FLUJO
- 10 PLANTILLAS
- 11 ANEXO
   - 11.1 Anexo I: Tabla de precios para ensayos de fuego
      - 11.1.1 Tarifas con Medios INTA
      - 11.1.2 Tarifas con Medios Ajenos del INTA


```
Página: 4 de 54 Edición: 02
```
## 1 INTRODUCCIÓN

**1.1 Objeto**

```
El presente documento funcional tiene como objetivo describir de forma detallada el comportamiento,
estructura y lógica del módulo de Control Administrativo dentro de la aplicación INTAQAlab , desarrollada
para la gestión integral de pruebas de fuego en el entorno del Centro de Ensayos de Torregorda (CET).
Este módulo forma parte del sistema de gestión de ensayos y está orientado a facilitar el registro,
seguimiento, trazabilidad y control documental de las pruebas solicitadas por los clientes, desde su
creación hasta su cierre.
```
**1.2 Alcance**

```
El documento recoge los requisitos funcionales, los flujos de trabajo, los perfiles implicados, y las
acciones disponibles en cada fase del ciclo de vida de una prueba, garantizando la trazabilidad de todas
las operaciones realizadas por los usuarios.
Este análisis funcional servirá como base para el desarrollo, validación y evolución del sistema, asegurando
que las necesidades operativas del CET se vean reflejadas en la solución tecnológica propuesta.
```
**1.3 Abreviaturas**

```
No aplicable.
```
**1.4 Definiciones**

```
No aplicable.
```
## 2 DOCUMENTACIÓN.............................................................................................................................................................

```
Todos los documentos citados sin fecha o edición serán aplicables en su última edición.
```
**2.1 Documentos de requisitos legales**

```
No aplicable.
```
**2.2 Documentos aplicables**

```
(A rellenar por INTA si aplica)
```
**2.3 Documentos de referencia**

```
No aplicable.
```
## 3 GESTIÓN DE LA PRUEBA.................................................................................................................................................

**3.1 Creación de la prueba**


```
Página: 5 de 54 Edición: 02
```
Cuando el **CET** recibe una **solicitud de prueba** por parte de un cliente, ya sea mediante correo electrónico
o llamada telefónica, se procede al **registro de una nueva prueba**. Para ello, el sistema contará con una
sección del menú denominada **_Gestión de Pruebas_** , dentro de la cual existirá una subsección específica
llamada **_Nueva Prueba de Fuego_**. Esta interfaz estará accesible exclusivamente para los **perfiles
autorizados** : Administrativo de Ensayos, Jefatura de Ensayos de Armamento y Planificación y Análisis.
Desde esta interfaz, será posible **introducir los datos básicos requeridos** , **adjuntar documentación** y
**registrar oficialmente la prueba** en el sistema para su posterior **planificación** , **presupuestación,
ejecución** y **seguimiento**.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Una vez creada, la información de la prueba estará disponible en la pestaña de información general. Desde
esta pestaña se podrán consultar tanto los datos introducidos durante el alta y la documentación asociada.

#### 3.3.1 Modificación de una prueba

1. **Acceso a la pantalla de alta**
El usuario deberá hacer clic en la opción **_Nueva Prueba de Fuego_** del **menú lateral** **_Gestión de pruebas_** ,
lo que abrirá la pantalla de creación de prueba.
2. **Ingreso de información básica**
El formulario permitirá registrar:
    - **Número de prueba** :
        Será generado automáticamente por el sistema de forma secuencial.


```
Página: 6 de 54 Edición: 02
```
```
 El formato será NNNN/AA , donde:
```
- **NNNN** representa un número secuencial de 4 cifras con ceros a la izquierda
    (ej.: 0001, 0123).
- **AA** representa los dos últimos dígitos del año en curso (ej.: 25 para 2025).
 El sistema deberá validar que **no existan duplicados** , impidiendo el guardado si ya
existe otra prueba con el mismo número.
- **Casilla de prueba asociada:** al marcar esta opción, se abrirá un modal que mostrará un listado
de pruebas registradas en el sistema, independientemente de su estado. Las pruebas estarán
ordenadas por fecha de creación, de más reciente a más antigua. Además del número de
prueba, se visualizarán los campos año, cliente y descripción, y se podrá filtrar por cualquiera
de ellos. El filtro del campo descripción será del tipo _contiene "X"_ , permitiendo localizar pruebas
mediante coincidencias parciales en el texto.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
- **Casilla de prueba vinculada:** al marcar esta opción, se abrirá un modal con las mismas
    características que el de prueba asociada (listado, orden, campos visibles y filtros). Sin embargo,
    esta opción implica una relación operativa entre pruebas. Cuando se programe en calendario
    una prueba que tenga otra vinculada, esta última se programará automáticamente en la misma


```
Página: 7 de 54 Edición: 02
```
```
fecha. Los datos recogidos durante la ejecución de la prueba matriz se asociarán a la prueba
vinculada.
```
- **Descripción de la prueba** _(opcional)_. Campo de texto libre.
- **Tipo de prueba** : se habilitará un desplegable con todos los tipos de prueba registrados. Los
    tipos serán: particular, oficial, interna, vigilancia, homologación, aseguramiento de la calidad.
- **Cliente.** El sistema permitirá seleccionar al cliente desde un **desplegable con búsqueda por**
    **texto** , eligiendo entre los clientes registrados previamente en _Calibry_. Para el registro de un
    cliente en _Calibry_ , deberán constar al menos nombre de la empresa, domicilio social, correo
    electrónico y número de teléfono de contacto.
- **Referencia de cliente** _(opcional)_. Campo de texto libre para recoger la posible referencia o
    numeración que el cliente asigna a la prueba solicitada.
- **Fecha solicitada por el cliente** _(opcional)_. Podrá indicarse una **fecha solicitada por el cliente**
    mediante un selector de calendario, aunque la fecha o **fechas definitivas serán asignada**
    **posteriormente** por la Jefatura de Ensayos de Armamento.

_La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo._

- **Observaciones** _(opcional)_. Campo de texto libre.
- **Documentos adjuntos** _(opcional)_. El proceso para adjuntar documentos a una prueba se
    describe en el apartado Asignación de documentos a la prueba.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
3. **Confirmación**
Una vez introducida la información, el usuario podrá Aceptar, para registrar la prueba, o Cancelar, para
borrar los datos introducidos.
**Estados de la prueba**


```
Página: 8 de 54 Edición: 02
```
```
Al registrar una nueva prueba, el sistema le asignará automáticamente el estado "En estudio". A lo largo
del ciclo de vida de la prueba, su estado podrá evolucionar a los siguientes estados:
```
- Planificada
- En curso
- Interrumpida
- Iniciada
- Ejecutada
- Analizando
- Finalizando
- Cerrada
- Cancelada
- Anulada

```
El estado actual de la prueba será visible tanto en la ficha de la prueba como en el módulo de Pruebas
de fuego , permitiendo su consulta en todo momento por los usuarios con acceso.
La descripción detallada de estos estados se encuentra en el apartado Estados de una prueba del
presente documento.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
**3.2 Pestaña de información general de la prueba**

```
Para acceder a la Pestaña de información general de la prueba , el usuario deberá hacer clic sobre una
prueba desde el Calendario de Pruebas de Fuego o desde el listado de la sección Pruebas de Fuego.
```

```
Página: 9 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Las secciones **Calendario de Pruebas de Fuego** y **Pruebas de Fuego** se encuentran en el **menú
principal** :

- **Pruebas de Fuego** está incluida bajo la sección **Gestión de Pruebas**.
- **Calendario de Pruebas de Fuego** es una sección independiente dentro del menú.


```
Página: 10 de 54 Edición: 02
```
```
En la parte superior de la pantalla se muestran pestañas horizontales que permiten navegar entre las
distintas secciones de la prueba: Información general (pestaña activa por defecto), Planificación,
Análisis y Auditorías. Cada pestaña muestra los datos correspondientes a su fase o sección.
Esta pestaña de Información General recoge los datos principales de la prueba introducidos durante el
proceso de alta y permite su consulta o edición.
Campos que se muestran en pantalla:
```
- **Número de prueba**
- **Estado de la prueba**
- **Prueba asociada**
- **Prueba vinculada**
- **Línea de fuego:** selector de la línea donde se realizará la prueba.
- **Descripción de la prueba**
- **Tipo de prueba**
- **Cliente**
- **Referencia del cliente**
- **Fecha o fechas solicitadas por el cliente**
- **Fecha programada** : selector de una o varias fechas. Se actualizará automáticamente cuando
    el usuario encargado de programación asigne una fecha a la prueba según se describe en el
    apartado Visualización y programación en el calendario.
- **Observaciones**

```
Documentación asociada: en la parte inferior de la pantalla se mostrará una tabla con los documentos
vinculados a la prueba. Los campos que se incluyen en esta tabla están descritos en la sección Consulta
de documentos.
Acciones: en la parte superior de la pantalla se mostrará un botón “Acciones” que permita modificar, anular,
cancelar, reactivar, cerrar, reabrir o eliminar la prueba según el perfil de usuario y el estado de la prueba.
Los permisos son los detallados a continuación en la sección Acciones sobre la prueba.
```
**3.3 Acciones sobre la prueba**

```
Todas las acciones descritas en este apartado se realizarán desde la ventana “Pestaña de información
general de la prueba” , accesible desde las secciones Pruebas de Fuego y Calendario de Pruebas de
Fuego.
Estructura general de la pantalla:
La pestaña de información general de cada prueba incluirá en la parte superior un botón “Acciones”. Al
hacer clic en dicho botón, se desplegará un menú con las siguientes opciones:
```
- **Modificar**
- **Anular**
- **Cancelar**
- **Reactivar**
- **Cerrar**
- **Reabrir**


```
Página: 11 de 54 Edición: 02
```
- **Eliminar**

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Las opciones disponibles dependerán del estado actual de la prueba y del perfil del usuario.

**Flujo de gestión:**

1. **Acceso a la prueba**. El usuario accede a la ficha individual de una prueba desde la pestaña **Pruebas**
    **de Fuego** o la pestaña **Calendario de Pruebas de Fuego** ubicadas en el menú principal.
2. **Visualización de opciones disponibles.** Dentro de la ficha, el botón **“Acciones”** mostrará
    únicamente las opciones habilitadas según el estado actual de la prueba y los permisos del usuario.
Las opciones estarán habilitadas únicamente si la prueba se encuentra en estado **“En estudio”** , salvo
en los siguientes casos:
    - **Cancelación:** podrá llevarse a cabo en cualquier momento del ciclo de vida de la prueba.
    - **Reactivar:** disponible únicamente cuando la prueba se encuentre en estado **“Cancelada”** o
       **“Anulada”**.
    - **Cerrar:** disponible únicamente cuando la prueba se encuentre en estado **“Finalizando”**.
    - **Reabrir:** disponible únicamente cuando la prueba se encuentre en estado **“Cerrada”.**

#### 3.3.2 Cancelación de una prueba

La modificación de una prueba solo estará permitida cuando su estado sea **"En Estudio"**. Se permitirá la
edición de todos los campos de la prueba, **excepto el número de prueba**.

Al seleccionar la opción **“Modificar prueba”** , los campos de la ficha pasarán de estar en **modo lectura a
modo edición** , permitiendo al usuario actualizar la información necesaria.


```
Página: 12 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
En la pantalla estarán disponibles los siguientes botones para gestionar la información:

- **Cancelar:** Permite descartar los cambios realizados y volver al estado anterior sin guardar la
    información introducida.
- **Guardar:** Guarda la información introducida y la modifica en la ficha de información general de
    la prueba.


```
Página: 13 de 54 Edición: 02
```
Al guardar los cambios, el sistema registrará internamente la **fecha, hora y usuario** que realizó la
modificación, con fines de trazabilidad. Esta información se mostrará en la pestaña _Auditoría de datos
generales_.

**Perfiles autorizados:**

- Administrativo de Ensayos
- Jefatura de Ensayos de Armamento
- Planificación y Análisis
- Administrador del sistema

#### 3.3.3 Anulación de una prueba

Una prueba podrá ser cancelada si ya ha iniciado su preparación o ejecución, pero debe interrumpirse por
causas justificadas.

_Al seleccionar la opción “Cancelar prueba”, se mostrará un modal con un campo de texto obligatorio donde_
el usuario deberá indicar el motivo de la cancelación.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Una vez confirmada, el estado de la prueba pasará a **“Cancelada”** , y la acción registrará internamente la
**fecha, hora, usuario y motivo** de la cancelación. Además, se registrará el estado de la prueba en el
momento de la cancelación. El motivo de la cancelación se podrá consultar en la Pestaña de Información
General de la prueba, junto al estado de esta.


```
Página: 14 de 54 Edición: 02
```
En el modal estarán disponibles los siguientes botones para gestionar la información:

- **Cancelar prueba:** Confirma la cancelación de la prueba seleccionada, cambiando su estado a
    "Cancelada" e impidiendo su ejecución posterior.
- **Volver:** Cierra la ventana de confirmación y mantiene la prueba en su estado actual, sin realizar
    cambios.

**Perfiles autorizados:**

- Jefatura de Ensayos de Armamento
- Ingeniero de Ensayos
- Planificación y Análisis
- Administrador del sistema

Una prueba cancelada podrá ser **reactivada** si fuera necesario, cambiando su estado para permitir su
modificación o replanificación. Esta reactivación también será registrada por el sistema. En el apartado
reactivación de una prueba se describe el proceso para reactivar la prueba.

#### 3.3.4 Eliminación de una prueba

Solo podrá anularse una prueba que **no haya sido ejecutada ni esté en curso,** es decir, pruebas cuyo
_estado sea “_ **En estudio”**. El estado de la prueba pasará a **“Anulada”** , manteniéndose en el sistema por
motivos de trazabilidad.

_Al seleccionar la opción “_ **Anular** _”, se mostrará un modal con un campo de texto obligatorio donde el usuario_
deberá indicar el motivo de la anulación.


```
Página: 15 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Una vez confirmada, el estado de la prueba pasará a **“Anulada”** , y la acción registrará internamente la
**fecha, hora, usuario y motivo** de la cancelación.

En el modal estarán disponibles los siguientes botones para gestionar la información:

- **Anular prueba:** Confirma la anulación de la prueba seleccionada, cambiando su estado a "Anulada"
    e impidiendo su ejecución posterior.
- **Volver:** Cierra la ventana de confirmación y mantiene la prueba en su estado actual, sin realizar
    cambios.

**Perfiles autorizados:**

- Administrativo de Ensayos
- Jefatura de Ensayos de Armamento
- Jefatura de Planificación y Análisis
- Administrador del sistema

Una prueba anulada podrá ser **reactivada** , cambiando su estado y permitiendo su posterior planificación o
modificación. La reactivación también será registrada.

#### 3.3.6 Reactivación de una prueba


```
Página: 16 de 54 Edición: 02
```
Esta acción implica el **borrado definitivo** de la prueba del sistema y solo estará disponible si la prueba **no
está en curso ni ha sido ejecutada** _, es decir, pruebas cuyo estado sea “_ **En estudio”**.

Se reserva exclusivamente para **casos de error durante la creación** de la prueba. En este caso, el número
de prueba volvería a estar disponible para asignarlo a una nueva prueba.

Antes de eliminar la prueba, el sistema mostrará una **ventana emergente de confirmación** , con:

- Un mensaje claro indicando que la acción que se va a realizar será irreversible.
- El **número de prueba** afectado.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
En la ventana emergente estarán disponibles los siguientes botones para gestionar la información:

- **Eliminar prueba:** Confirma la eliminación de la prueba seleccionada, cambiando su estado a
    "Eliminada" y borrándola completamente del sistema.
- **Volver:** Cierra la ventana de confirmación y mantiene la prueba en su estado actual, sin realizar
    cambios.

**Perfiles autorizados:**

- Administrador del sistema

#### 3.3.5 Cierre de una prueba.........................................................................................................................

El cierre de una prueba implica la **finalización definitiva de su ciclo de vida** , quedando bloqueadas todas
las acciones salvo la reapertura y no permitiéndose más modificaciones sobre la misma. Una prueba podrá
cerrarse únicamente cuando su estado sea **“Finalizando”**.


```
Página: 17 de 54 Edición: 02
```
Antes de cerrar la prueba, el sistema mostrará una **ventana emergente de confirmación** , con:

- Un mensaje claro indicando la acción que se va a realizar.
- El **número de prueba** afectado.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
En la ventana emergente estarán disponibles los siguientes botones para gestionar la información:

- **Cerrar prueba:** Confirma el cierre de la prueba seleccionada, cambiando su estado a "Cerrada" e
    impidiendo modificaciones sobre la misma.
- **Volver:** Cierra la ventana de confirmación y mantiene la prueba en su estado actual, sin realizar
    cambios.

Una vez confirmada, el estado de la prueba pasará a **“Cerrada”** , y la acción registrará internamente la
**fecha, hora y usuario**.

**Perfiles autorizados:**

- Administrativo de Ensayos
- Jefatura de Ensayos de Armamento
- Administrador del sistema
- Jefatura de Planificación y Análisis

**3.3.6 Reactivación de una prueba**


```
Página: 18 de 54 Edición: 02
```
La reactivación de una prueba permite restablecer su ciclo de vida, habilitando nuevamente las acciones y
estados correspondientes a una prueba en curso.

Una prueba podrá ser reactivada únicamente cuando su estado actual sea **“Anulada”** o **“Cancelada”**.

Antes de reactivar la prueba, el sistema mostrará una **ventana emergente de confirmación** , con:

- Un mensaje claro indicando la acción que se va a realizar.
- El **número de prueba** afectado.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
En la ventana emergente estarán disponibles los siguientes botones para gestionar la información:

- **Reactivar prueba:** Confirma la reactivación de la prueba seleccionada.
- **Volver:** Cierra la ventana de confirmación y mantiene la prueba en su estado actual, sin realizar
    cambios.

Una vez confirmada la reactivación:

- **Si la prueba estaba anulada** , su estado cambiará a **“En estudio”**.
- **Si la prueba estaba cancelada** , volverá al estado **inmediatamente anterior.**
- **Si la prueba estaba cancelada mientras estaba “En curso”** , su estado cambiará a **“Iniciada”**.

El sistema registrará internamente la **fecha** , **hora** y **usuario** que realizó la reactivación, con fines de
trazabilidad.

**Perfiles autorizados:**

- Administrativo de Ensayos


```
Página: 19 de 54 Edición: 02
```
- Jefatura de Ensayos de Armamento
- Jefatura de Planificación y Análisis
- Administrador del sistema

#### 3.3.7 Reapertura de una prueba

La reapertura de una prueba permite revertir un cierre realizado por error, devolviéndola a un estado que
permita finalizar correctamente su ciclo de vida.

Una prueba podrá reabrirse únicamente cuando su estado actual sea **“Cerrada”**.

Antes de reabrir la prueba, el sistema mostrará una **ventana emergente de confirmación** , con:

- Un mensaje claro indicando la acción que se va a realizar.
- El **número de prueba** afectado.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
En la ventana emergente estarán disponibles los siguientes botones para gestionar la información:

- **Reabrir prueba:** Confirma la reapertura de la prueba seleccionada.
- **Volver:** Cierra la ventana de confirmación y mantiene la prueba en su estado actual, sin realizar
    cambios.

Una vez confirmada la reapertura:

- El estado de la prueba cambiará a **“Finalizando”**.
- Se habilitarán nuevamente las acciones disponibles para dicho estado.


```
Página: 20 de 54 Edición: 02
```
```
El sistema registrará internamente la fecha , hora y usuario que realizó la reapertura, con fines de
trazabilidad.
Perfiles autorizados:
```
- Administrativo de Ensayos
- Administrador del sistema

## 4 VISUALIZACIÓN Y PROGRAMACIÓN EN EL CALENDARIO

```
La aplicación deberá incluir una pantalla denominada Calendario de pruebas de fuego , accesible desde
el menú principal. Esta pantalla permitirá todos los usuarios visualizar las pruebas programadas, y a los
usuarios de Administrativo de Ensayos, Planificación y Análisis y Jefatura de Ensayos gestionar la
programación de las pruebas de fuego.
```
**4.1 Estructura general de la pantalla**

```
En la pantalla se visualizarán los siguientes componentes:
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
- **Selector de línea de fuego** :
     En la parte superior de la pantalla se incluirá un botón que permita al usuario alternar entre:
       ▪ **Línea 1**


```
Página: 21 de 54 Edición: 02
```
```
▪ Línea 2
▪ Todas las líneas
 El calendario se actualizará dinámicamente en función de la línea seleccionada, mostrando
únicamente las pruebas asociadas a dicha línea de fuego.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
- **Vista de calendario** en formatos:
     **Diario** , **semanal** y **mensual**.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
 Botón “Hoy” para volver al día, semana o mes actual, en función de la vista seleccionada.
 La visualización estará restringida a los días laborables: de lunes a viernes.
Los fines de semana (sábado y domingo) no se mostrarán por defecto en ninguna vista, pero
el usuario tendrá la posibilidad de visualizarlos si así lo desea.
```

```
Página: 22 de 54 Edición: 02
```
- **Cada celda de día** incluirá:

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
 El listado de pruebas programadas para ese día. En la vista diaria y semanal , se mostrará
en un recuadro por cada prueba su número de prueba, línea , cliente y descripción ,
información que proviene directamente de los datos introducidos en la pantalla de alta de la
prueba. En la vista mensual, en caso de que el texto no quepa, se mostrará truncado con puntos
suspensivos, y al pasar el cursor sobre el cuadro se desplegará la información completa.
Además, se asignará un color a la prueba en función de su estado:
▪ Azul (En estudio, Planificada)
▪ Naranja (En curso, Interrumpida, Iniciada)
▪ Verde (Cerrada, Analizando, Finalizando)
 Un botón de tres puntos ( ⋮ ) visible en la esquina superior de la celda. Al hacer clic, se mostrarán
dos opciones :
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
▪ Añadir observación. Esta opción abrirá una ventana modal en la que el usuario podrá
introducir texto libre. Dentro de esta ventana, contará con dos posibilidades: confirmar
la acción pulsando el botón “Añadir” , lo que guardará la observación, o bien cerrar la
```

```
Página: 23 de 54 Edición: 02
```
```
ventana mediante el botón “Cancelar” , sin que quede registrada la información
introducida.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
▪ Programar prueba. A continuación, se describe le flujo de programación de una
prueba.
```
**4.2 Flujo de programación de pruebas**

1. El usuario hace clic en el botón de tres puntos (⋮) dentro de una celda del calendario.
2. Selecciona la opción **“Programar prueba”**.
3. **El sistema abrirá una ventana modal** que mostrará una tabla con los siguientes campos: **número de**
    **prueba, observaciones, cliente, tipo de prueba, fecha solicitada por el cliente y acciones**. La tabla


```
Página: 24 de 54 Edición: 02
```
```
incluirá únicamente las pruebas pendientes de ejecución , es decir, aquellas cuyo estado aún no haya
alcanzado “Ejecutada”. No obstante, las pruebas que ya tengan una o varias fechas programadas
continuarán apareciendo en el listado , dado que pueden planificarse para su ejecución en varios días.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
4. **En la columna Acciones, el modal incluirá un selector de calendario** que permitirá al usuario
    **programar la prueba en uno o varios días.** En el calendario se mostrarán:
       - **Días inhábiles.**
       - **Días sin NOTAM** : no se podrán programar pruebas.
       - **Días de prueba** (ya existen pruebas programadas): sí podrán seleccionarse si el usuario lo
          estima oportuno.
5. _El usuario tendrá habilitados los botones “Programar prueba”, para confirmar la fecha o fechas_
    _seleccionadas, o “Cancelar” para cerrar el modal sin guardar los cambios._


```
Página: 25 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
6. Tras confirmar, las pruebas seleccionadas se mostrarán directamente dentro de la celda del calendario
    correspondiente.


```
Página: 26 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
7. Esta acción se registrará automáticamente en el sistema, actualizando la información de programación
    en la pestaña de **Planificación General**.
8. Si un usuario necesita **desasignar una prueba ya programada** , podrá hacerlo haciendo clic sobre el
    _icono “Papelera”_ de la prueba en el calendario.


```
Página: 27 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
Permisos:
```
- Todos los usuarios podrán acceder en **modo visualización**.
- La **edición del calendario** (programación, des asignación y observaciones) estará restringida a los
    perfiles:
        **Administrativo de Ensayos**
        **Jefatura de Ensayos de Armamento**
        **Ingeniero de Ensayos**

**4.3 Gestión de días especiales en el calendario**


```
Página: 28 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
En el calendario, **los sábados y domingos no se mostrarán por defecto** , ya que se consideran días no
laborables por defecto, aunque el usuario tendrá la posibilidad de visualizarlos si así lo desea.

Los días no laborables aparecerán visibles y se diferenciarán claramente de los días sin NOTAM mediante
algún estilo visual. Un **día sin NOTAM** es aquel en el que no se tiene autorización del espacio aéreo para
realizar pruebas, por lo que no se podrán programar ensayos en esas fechas. En estas fechas, el botón de
opciones para programar pruebas estará deshabilitado, impidiendo la asignación de pruebas.

```
Los usuarios con el rol de Administrativo de Ensayos tendrán acceso a un botón específico en la
```
pantalla del calendario denominado **“Gestionar días especiales”**.
Al pulsarlo, se abrirá un **modal** con un selector de calendario que permitirá seleccionar múltiples fechas
a la vez y asignarlas como:

- Días inhábiles
- Días sin NOTAM


```
Página: 29 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Al confirmar la selección:

- Las fechas se reflejarán en el calendario con un estilo que las diferencie según su tipo.
- No se podrá programar ninguna prueba en esos días.

En el calendario, los días con pruebas ya programadas se mostrarán resaltados. Estos días no podrán ser
seleccionados como días especiales por el usuario con rol de Administrativo de Ensayos.

También se permitirá **anular días marcados previamente como no inhábiles o sin NOTAM**. Para ello,
el usuario deberá seleccionar el día correspondiente y pulsar un botón **“Anular”** , devolviendo el día a su
condición hábil y habilitando nuevamente la programación de pruebas.


```
Página: 30 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
## 5 GESTIÓN DOCUMENTAL

```
La gestión documental asociada a las pruebas se realiza de forma centralizada desde la ficha de
información general de cada prueba , donde todos los usuarios encontrarán una tabla con todos los
documentos vinculados. Desde esta tabla podrán realizar acciones como consultar, añadir, versionar o
eliminar documentos, gestionar sus permisos, trazabilidad y controlar su estado (en vigor u obsoleto).
```
**5.1 Categorías y tipos de documentos**

```
El sistema distinguirá dos categorías de documentación, en función de su naturaleza y modo de gestión :
```
- **Documentos generales** (de **índole general** ) que no están asociados a una prueba concreta, como
    procedimientos, instrucciones o normativas. Estos documentos se **gestionan exclusivamente en**
    **Calibry** , se almacenan en SharePoint y **pueden vincularse opcionalmente a una prueba** para
    facilitar su consulta desde la ficha, aunque no formen parte directa del expediente de esta.
- **Documentos asociados a pruebas** (de **índole particular** ), como solicitudes, autorizaciones,
    contratos, planes de ensayo o informes. Estos se **gestionan directamente desde la aplicación** y


```
Página: 31 de 54 Edición: 02
```
```
se vinculan a la ficha de cada prueba. También se almacenan en SharePoint, permitiendo su
trazabilidad y consulta directa.
La siguiente tabla recoge los tipos de documentos considerados en el sistema, indicando dónde se
gestionan y desde dónde se pueden consultar:
```
```
Categoría Tipo Gestión Visualización
```
```
Particular Autorización Aplicación Aplicación
```
```
Particular Certificado de conformidad Aplicación Aplicación
```
```
Particular Comunicaciones Aplicación Aplicación
```
```
Particular Datos meteorológicos Aplicación Aplicación
```
```
Particular
Documentación de referencia
```
```
Aplicación Aplicación
```
```
General Calibry Aplicación/Calibry
```
```
Particular Informe de actividad técnica Aplicación Aplicación
```
```
Particular Informe externo Aplicación Aplicación
```
```
Particular Otros Aplicación Aplicación
```
```
Particular Plan de ensayos Aplicación Aplicación
```
```
Particular Presupuesto Calibry Aplicación/Calibry
```
```
Particular Solicitud Aplicación Aplicación
```
```
Particular Catálogo de Ensayos Aplicación Aplicación
```
```
Particular Nota de experiencias Aplicación Aplicación
```
```
Tabla 1 Tipos de documentos
```
**5.2 Asignación de documentos a la prueba**


```
Página: 32 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Cualquier usuario podrá asignar un documento a una prueba. La asignación de documentos a una prueba
podrá realizarse en dos momentos:

- **Durante el alta de la prueba** , como parte del formulario de creación.
- **Posteriormente** , desde la **ficha de información general de la prueba** , y seleccionando la opción
    **“Agregar documento”** situada junto a la tabla de documentos.

En ambos casos, al iniciar la carga se abrirá una **ventana modal** que permitirá al usuario subir un nuevo
archivo desde su equipo. Solo se podrá realizar la carga de un documento a la vez.


```
Página: 33 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
**Elementos de la ventana de carga:**

1. **Selector de tipo de documento**
     Se mostrará un **desplegable con buscador predictivo**.
     El usuario deberá seleccionar **obligatoriamente** uno de los tipos definidos previamente (por
       ejemplo: _solicitud_ , _autorización_ , _informe_ , etc.).
     Si el usuario no selecciona un tipo, el botón de subida permanecerá inactivo.
2. **Selector de archivo**
     Se incluirá un **campo interactivo** (botón o área de arrastre) que abrirá el **explorador de**
       **archivos del sistema**.
     El usuario podrá seleccionar un único archivo digital desde su equipo.
     Se permitirá adjuntar cualquier archivo independientemente de su extensión.
3. **Botón “Subir documento”**
     Este botón solo se activará cuando ambos campos (tipo y archivo) estén correctamente
       cumplimentados.
     Al pulsarlo, el sistema realizará la carga del documento y lo asociará a la prueba en curso.
     El sistema registrará la fecha y hora de subida de cada documento, así como el usuario que
       realizó la carga. Esta información se mostrará posteriormente en la pestaña **_Event Log_**
       dentro de la Ficha de la prueba.


```
Página: 34 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
**5.3 Consulta de documentos**


```
Página: 35 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
La consulta de documentos asociados a una prueba se realizará exclusivamente desde la **ficha principal**
de cada prueba. En ella se mostrará una **tabla con los documentos vinculados** , incluyendo tanto los
particulares como los generales que se hayan asociado para consulta.

Los **documentos generales** (procedimientos, instrucciones, normativas) también se consultarán
directamente en Calibry.


```
Página: 36 de 54 Edición: 02
```
```
Justo encima de la tabla, se incluirá una casilla de verificación denominada “Mostrar solo documentos
en vigor”. Esta opción estará activada por defecto, de modo que inicialmente se visualicen únicamente los
documentos activos. Al desmarcarla, el sistema mostrará también los documentos obsoletos, permitiendo
así consultar versiones históricas sin perder visibilidad.
La tabla mostrará la siguiente información relevante para cada documento:
```
**Estado Versión Categorí**

```
a
```
```
Tipo Título Fecha Acciones
```
En vigor V2 Particular Informe Informe_resultados.pdf 15/07/2025 (^)
En vigor V3 Particular Autorización Autorización.pdf 10/07/2025 (^)
Obsoleto V1 General Procedimiento ProcedimientoX.pdf 01/01/2024 (^)
**Tabla 2 Ejemplo de tabla de documentos relacionados con la prueba**
_La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo._

- **Estado:** _Indica si el documento está “En vigor” (activo) u “Obsoleto” (histórico)._
- **Versión:** Versión actual del documento, por ejemplo, v1, v2, etc.
- **Categoría:** Clasificación según la naturaleza del documento: general o particular.
- **Tipo:** Categoría específica dentro del tipo, como Informe, Autorización, Plan de ensayos, etc.
- Título: Nombre asignado al documento por el usuario. Por defecto será el nombre del archivo cargado,
    aunque podrá ser modificado por el usuario.
- Fecha: Fecha de subida o última modificación.
- Acciones: Botones interactivos que permiten:
     **Acciones: Botones interactivos que permiten:**
       ▪ **Previsualizar:** Visualizar el documento sin necesidad de descargarlo.
       ▪ **Descargar:** Descargar el archivo al dispositivo local.


```
Página: 37 de 54 Edición: 02
```
```
▪ Visualizar ficha: Abrir la ficha del documento.
▪ Eliminar: Borrar el documento del sistema.
```
```
La tabla mostrará primero los documentos en vigor, seguidos debajo por los obsoletos, para facilitar la
consulta de los documentos activos manteniendo acceso a versiones históricas.
Adicionalmente, se incluirá un botón para Agregar nuevos documentos a la prueba en la parte superior
de la tabla.
```
**5.4 Ficha del documento**

```
Cuando un usuario pulse el botón de visualización de ficha (representado con un icono de “ documento ” ) en
la tabla de documentos vinculados a una prueba, el sistema abrirá una ficha detallada del documento,
visible para todos los usuarios. Esta ficha proporciona una vista estructurada y completa del archivo
seleccionado, permitiendo al usuario consultar su información, revisar su historial y gestionar su trazabilidad
de forma intuitiva y segura.
La ficha del documento está organizada en varias pestañas , cada una enfocada a un aspecto específico
de la gestión documental.
```
#### 5.4.1 Pestaña ”Documento”

```
A. Información principal
```

```
Página: 38 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
En esta pestaña, el usuario podrá consultar y gestionar toda la información relacionada con un documento
previamente cargado en el sistema. La interfaz mostrará los **datos principales del archivo** , incluyendo:

- La **categoría y el tipo** asignado.
- El **nombre del usuario responsable** , es decir, quien lo subió originalmente.
- El **título del archivo**.
- **Relación con pruebas vinculadas**

Debajo de esta información, se mostrará una **tabla con la relación de pruebas vinculadas al
documento** , donde se indicará:

- El identificador de cada prueba asociada.
- El usuario que realizó la vinculación.


```
Página: 39 de 54 Edición: 02
```
- La fecha en la que se efectuó.
**B. Gestión del documento (Botón “Acciones”)**

Este botón desplegará un menú con las operaciones disponibles, **accesibles solo para el usuario que
subió el documento o para usuarios con rol Administrador** , y únicamente si el estado de la prueba lo
_permite (no se podrá modificar o eliminar documentos de pruebas en estado “cerrada”). Las opciones_
incluyen:

- **Modificar documento:** Permite editar el tipo y el título del documento. Esta opción se deshabilita
    automáticamente si la prueba asociada está cerrada, para proteger la integridad histórica y evitar
    cambios posteriores.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
- **Eliminar documento:** Esta acción solo estará disponible si el documento no está vinculado a
    más pruebas. En caso de que esté vinculado a varias pruebas, al intentar eliminarlo desde una
    prueba concreta, el sistema lo **desvinculará únicamente de esa prueba** , manteniéndolo activo


```
Página: 40 de 54 Edición: 02
```
```
en las demás. Para prevenir eliminaciones accidentales, al activar esta opción aparecerá una
ventana modal con una advertencia clara sobre la naturaleza irreversible de la acción,
requiriendo doble confirmación antes de proceder. Esta función también queda bloqueada si la
prueba está cerrada.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
- **Asociar a otra prueba:** Permite reutilizar un documento ya existente en nuevas pruebas sin
    necesidad de subirlo de nuevo. Al seleccionarla, se abrirá una ventana emergente con un
    buscador para localizar y seleccionar una o varias pruebas adicionales. Tras confirmar, el
    documento _se mostrará automáticamente en la pestaña “Información general” de las pruebas_
    vinculadas, facilitando la trazabilidad y consulta desde múltiples puntos.


```
Página: 41 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
- **Nueva versión:** Habilita a los usuarios con permisos para subir documentos a cargar una
    versión actualizada. El detalle de esta gestión se encuentra en la pestaña **_Versiones_**.


```
Página: 42 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
#### 5.4.2 Pestaña ”Versiones”

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
La pestaña **Versiones** muestra un historial completo y estructurado de todas las versiones asociadas a un
documento particular.


```
Página: 43 de 54 Edición: 02
```
- Cada versión se presenta en una lista que incluye:
     Número de versión (v1, v2, v3, etc.), asignado automáticamente por el sistema al cargar el
       documento.
     Fecha de carga.
     Usuario que subió la versión.
- Junto a cada versión, hay una casilla seleccionable para marcar cuál es la versión **en vigor**. Solo
    puede haber una versión activa en un momento dado.
- Para cambiar la versión en vigor, el usuario deberá seleccionar la casilla correspondiente a la versión
    deseada. Esta acción estará protegida mediante una doble confirmación para evitar cambios
    accidentales.
- La versión marcada como activa será la que el sistema utilice por defecto en informes, consultas y
    demás funcionalidades relacionadas.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
## 6 PROCESO DE GENERACIÓN DE PRESUPUESTOS

```
Tras el alta de la prueba en el sistema, los usuarios de Administrativo de Ensayos se procederán a la
elaboración del presupuesto asociado a la prueba mediante Calibry. Este proceso puede comenzar cuando
el cliente proporciona el plan de ensayos , ya que permite determinar aspectos clave como el tipo de arma
utilizada , el sistema de medición de presión , los servicios adicionales requeridos o el nivel de
desgaste del tubo. Todos estos datos se detallan en el apartado Criterios de cálculo del presupuesto del
presente documento.
```

```
Página: 44 de 54 Edición: 02
```
**6.1 Criterios de cálculo del presupuesto**

```
El presupuesto se calcula en función de varios factores clave, que determinan el precio base y los
suplementos aplicables:
```
- **Tipo de arma** utilizada en la prueba.
- **Sistema de medición de presión** , ya sea mediante manómetros o sensores piezoeléctricos.
- **Servicios adicionales** requeridos (grabación en vídeo, trayectografía, o ambos).
- **Desgaste del tubo** utilizado en la prueba.
A partir de estas condiciones, se establece un precio para el **primer disparo** , así como un suplemento por
cada **disparo adicional**.
En el ANEXO I, se muestra una tabla de precios considerando todos los factores mencionados en el
apartado.

**6.2 Consideraciones especiales**

```
En determinadas situaciones, se aplicarán condiciones específicas de cálculo sobre el presupuesto:
```
- **Pruebas realizadas en varios días** : si la prueba se extiende durante **dos o más jornadas** , se
    aplicará un **precio completo por el primer disparo de cada día** , mientras que el **resto de los**
    **disparos** realizados en esas mismas fechas se **presupuestarán como adicionales**.
- **Aportación de tubo por parte del cliente** : en caso de que el cliente aporte su **propio tubo** , no se
    aplicará la **tarifa por desgaste** correspondiente.
- **Costes fijos adicionales** : podrán incluirse en el presupuesto ciertos **gastos fijos**
    **complementarios** , tales como **servicios sanitarios, vigilancia marítima** u otros requerimientos
    específicos según las características de la prueba.

**6.3 Revisión y modificaciones del presupuesto**

```
Durante el ciclo de vida de una prueba, es frecuente que el presupuesto inicial deba revisarse o
modificarse. Estas modificaciones pueden producirse en dos momentos clave:
```
1. **Antes del inicio de la prueba** :
El presupuesto puede ser **ajustado** si el cliente aporta nueva información o solicita **cambios en el plan
de ensayo** , como variaciones en el tipo de armamento, el número de disparos o los servicios requeridos.
En estos casos, el sistema permite **actualizar la planificación** y generar una **nueva versión del
presupuesto** , manteniendo un historial de revisiones.
2. **Durante la ejecución de la prueba:**
Es posible realizar **modificaciones sobre la marcha** , como la **inclusión o eliminación de disparos** ,
siempre que exista **acuerdo previo con el cliente**. Estas modificaciones afectarán directamente al
presupuesto y quedarán reflejadas en el sistema, con las correspondientes actualizaciones de coste.
En el caso de que el cliente **rechace un presupuesto** , existen dos posibles vías de actuación:
- Se podrá realizar una **nueva planificación** , incorporando las **modificaciones solicitadas por
el cliente** , con el fin de generar un presupuesto revisado que se ajuste a los nuevos
requerimientos.


```
Página: 45 de 54 Edición: 02
```
- Si se decide **no continuar con la prueba** , el sistema permitirá **anularla** , siendo obligatorio
    registrar una **observación que justifique el motivo de la anulación**. Esta información
    quedará registrada para garantizar la **trazabilidad** de las decisiones.

**6.4 Integración con SAP**

```
Una vez finalizada la prueba, el jefe del departamento de Planificación y Análisis se encarga de verificar
que el contenido del presupuesto refleja fielmente lo realmente ejecutado y que toda la información
es correcta. Tras esta validación, el presupuesto debe ser firmado por el jefe del centro y, a continuación,
registrado en el sistema SAP para su procesamiento. Este registro permitirá la emisión de la factura
correspondiente , que será enviada al cliente.
```
## 7 PRUEBAS DE FUEGO

```
El módulo de Pruebas de Fuego tiene como objetivo principal facilitar el seguimiento del estado y los
tiempos de gestión de cada prueba desde su creación hasta su cierre. Este módulo permite conocer, en
tiempo real, en qué fase del ciclo de vida se encuentra una prueba y verificar el grado de avance en las
distintas dependencias implicadas. Además, proporciona visibilidad sobre posibles cuellos de botella,
retrasos o interrupciones, permitiendo así una gestión más eficiente del proceso de ensayo.
El módulo será accesible desde la pestaña Pruebas de Fuego , dentro del menú principal Gestión de
Pruebas.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```

```
Página: 46 de 54 Edición: 02
```
```
Los datos disponibles en esta tabla podrán ser descargados en formato Excel por cualquier usuario con
acceso al módulo.
```
**7.1 Estados de una prueba**

```
Los distintos estados por los que puede pasar una prueba a lo largo de su ciclo de vida se describen a
continuación:
```
- **En estudio:** Este estado se asignará **automáticamente al crear una nueva prueba,** y permanecerá
    activo **mientras se evalúa su viabilidad técnica, operativa o administrativa** antes de proceder a
    su planificación.
- **Planificada:** La planificación de la prueba ha sido validada por parte del usuario de Planificación y
    Análisis. Además, se están llevando a cabo las **tareas previas necesarias para la ejecución de la**
    **prueba** , como el montaje de equipos, la asignación de recursos o la coordinación de personal. Este
    estado **requiere la validación de todos los responsables implicados** antes de poder iniciar la
    prueba.
- **En curso** : La prueba se encuentra **en fase de ejecución activa**. Este estado solo se podrá activar
    una vez que todos los usuarios con tareas de preparación asignadas hayan validado la preparación.
- **Interrumpida** : La ejecución ha sido **detenida temporalmente**. Este estado puede ser activado por
    **cualquier usuario implicado en la ejecución** y requiere indicar **la y causa de la interrupción**. Este
    estado será utilizado para la **generación de indicadores de control, registrando la fecha y hora**
    **de inicio y fin de la interrupción, el usuario que provoca el cambio de estado y la causa**.
- **Iniciada** : La ejecución ha comenzado, pero **aún no se han completado todos los disparos**
    **previstos** , es decir, la prueba no está en ejecución en ese momento. Para establecer el estado
    **"Iniciada"** , deberá existir en la **pantalla de ejecución** un **botón que permita pausar la prueba de**
    **forma intencionada** , con el objetivo de **retomarla en una fecha posterior**. Esta funcionalidad está
    pensada para situaciones en las que, por causas planificadas o sobrevenidas, se decide **interrumpir**
    **temporalmente la ejecución** sin considerarla finalizada. Este botón estará **disponible únicamente**
    **para los perfiles de Jefatura de Línea de Tiro y el Ingeniero de Ensayos** , quienes serán los
    **únicos autorizados para pausar la prueba**. Al activar esta opción, el sistema deberá solicitar
    **confirmación explícita** , así como el **registro del motivo** de la pausa, para garantizar la trazabilidad
    del proceso.
- **Ejecutada** : La fase de ejecución ha finalizado y la prueba queda **pendiente de procesamiento y**
    **validación de los datos obtenidos**. El responsable de cada unidad deberá **validar su parte**
    **correspondiente**.
- **Analizando** : Los responsables han validado las medidas tomadas durante el ensayo. Se están
    llevando a cabo las **tareas de análisis de resultados** y la **elaboración del informe técnico** de la
    prueba.


```
Página: 47 de 54 Edición: 02
```
- **Finalizando** : El **informe está ya finalizado** , y se están realizando los **trámites administrativos y**
    **burocráticos necesarios para su entrega oficial** al cliente o a la unidad solicitante.
- **Cerrada** : El ciclo completo de la prueba ha concluido. Todos los datos, documentos e informes han
    sido validados y archivados. El departamento de **Administrativo de Ensayos** debe **cerrar**
    **manualmente la prueba** desde la ficha general de prueba.
- **Cancelada** : La prueba se cancela en una etapa intermedia del proceso. Es obligatorio indicar la
    **fecha y la causa de la cancelación**. En determinados casos, podrá ser necesaria la **emisión de**
    **factura por los trabajos ya realizados**.
- **Anulada** : La prueba se cancela antes de iniciar cualquier acción o ejecución. No implica costes ni
    requiere emisión de factura.

**7.2 Campos de Pruebas de Fuego**

```
El sistema deberá disponer de una pantalla específica para el módulo Pruebas de Fuego , en la que se
visualizarán de forma centralizada en una tabla los datos clave asociados al seguimiento y estado de
las pruebas existentes.
Los campos mostrados en esta pantalla serán obtenidos de manera automática a partir de la información
registrada durante las fases de planificación y ejecución del ensayo. En ningún caso será necesario
introducir información adicional desde esta interfaz, ya que su función es exclusivamente de consulta ,
orientada a facilitar el monitoreo en tiempo real.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
A continuación, se detallan los campos que formarán parte de esta vista, así como su origen:
```
- **Número de prueba** : corresponde al identificador único asignado a cada prueba. Este dato se
    introduce manualmente durante el proceso de creación de una nueva prueba, siguiendo el formato
    establecido NNNN/AA, donde _NNNN_ representa un número secuencial y _AA_ las dos últimas cifras
    del año.
- **Estado de la prueba:** este campo muestra el estado actual en el que se encuentra la prueba dentro
    de su ciclo de vida. El valor corresponde a uno de los estados definidos en el apartado _Estados de_
    _una prueba_ y se actualiza automáticamente en función de las acciones realizadas sobre la prueba.
    Permite conocer de un vistazo el punto exacto del proceso en el que se encuentra cada ensayo.
- **Cliente:** campo que muestra el nombre de la persona o entidad que solicitó la realización del ensayo.
    _Esta información se registra en el momento de la creación de la prueba, mediante el campo “Cliente”._


```
Página: 48 de 54 Edición: 02
```
- **Descripción:** _muestra el contenido del campo “Descripción de la prueba”, introducido durante el alta_
    de la prueba o posteriormente desde su ficha. Este campo proporciona una visión general del
    propósito o naturaleza del ensayo y permite contextualizar la prueba de forma rápida y clara.
- **Tipo de prueba:** _corresponde al valor seleccionado en el campo “Tipo de prueba” durante el alta de_
    la prueba. Este dato permite clasificar el ensayo según su naturaleza.
- **Usuario asignado a la planificación** : este apartado mostrará el nombre del usuario asignado a la
    planificación en la pantalla de Planificación General.
- **Otros datos** :
     **Fecha(s) programada(s):** Fecha(s) programada(s) en el calendario para la prueba,
       mostradas en líneas separadas y orden cronológico. Si no existe fecha programada, se
       _muestra la fecha solicitada por el cliente en cursiva y con indicación “pendiente”._
     **Fechas límite:** fechas máximas establecidas para la validación y cierre de la prueba por los
       departamentos implicados. El cálculo y la asignación de estas fechas se describen en el
       apartado Cálculo de fechas límite.
     **Observaciones:** este campo mostrará el contenido introducido previamente en el apartado
       _“Observaciones” durante la creación de la prueba o bien añadido posteriormente desde la_
       ficha de la prueba.

**7.3 Cálculo de fechas límite**

```
En la pantalla del Control de Pruebas , el sistema mostrará de forma automática las fechas límite para la
validación de datos por parte de cada unidad implicada : Armamento , Municiones , Ensayos de Fuego
y Balística ; así como la fecha límite para la emisión del informe por parte del departamento de
Planificación y Análisis , y la fecha límite de Fin , correspondiente a la firma del informe por parte del
Jefe del Centro y su entrega al cliente.
```

```
Página: 49 de 54 Edición: 02
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Los usuarios del departamento de **Planificación y Análisis** podrán introducir, desde la pestaña **General** ,
dentro de la sección Planificación de la ficha de la prueba, el **número máximo de días laborables** en los
que se compromete la entrega del informe final al cliente (por defecto, **20 días laborables** ). Adicionalmente,
podrán definir el **porcentaje de ese plazo total** asignado a las unidades técnicas (Armamento, Municiones,
Ensayos de Fuego y Balística) para la **validación de datos** , y el **porcentaje restante** asignado a
Planificación y Análisis para la **elaboración del informe**.

Por defecto, el sistema propondrá:

- **20 días laborables** desde la **fecha de finalización del tiro** hasta la **fecha Fin** de la prueba.
- **40 %** del total destinado a **las unidades técnicas**.
- **60 %** del total destinado a **Planificación y Análisis**.
- La **fecha límite del informe** se establecerá **un día laborable antes** de la **fecha Fin** , para garantizar
    el tiempo necesario para su firma y entrega.

Estos valores serán **totalmente modificables** desde la ficha de la prueba.

El cálculo se realizará del siguiente modo:

- A partir de la **fecha de finalización del tiro** , se aplicará el porcentaje asignado a las unidades para
    calcular la **fecha límite de validación** para cada una de ellas ( **Armamento** , **Municiones** , **Ensayos**
    **de Fuego** y **Balística** ).
- A continuación, se aplicará el porcentaje restante para determinar la **Fecha Fin.**


```
Página: 50 de 54 Edición: 02
```
- Finalmente, la **fecha límite de informe** se establecerá como la fecha fin menos el máximo de días
    indicado para la firma (por defecto un día).
Para este cálculo, el sistema tendrá en cuenta los **días no laborables definidos en el calendario oficial** ,
configurable y actualizable por el departamento de **Administrativo de Ensayos** , garantizando así un
cómputo ajustado a los días inhábiles específicos del centro.
Estas fechas serán **calculadas automáticamente por el sistema** y se mostrarán en el **panel del módulo
de** **_Pruebas de Fuego_** , facilitando así el **seguimiento y cumplimiento de los plazos comprometidos** por
cada dependencia.

**7.4 Indicadores visuales para fechas límite y fechas reales**

```
Para facilitar el seguimiento y control de los plazos en la gestión de pruebas, se implementarán indicadores
de color que permitan una rápida interpretación del estado de las fechas límite y las fechas reales de
validación o emisión.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
- **Fecha límite:** este indicador refleja la fecha máxima establecida para que cada departamento valide
    sus datos o emita el informe correspondiente.
        **Verde:** Indica que la fecha límite está vigente y aún no ha sido superada, o bien que la
          validación o emisión se ha realizado dentro del plazo establecido (antes o en la fecha límite).
        **Amarillo:** Señala que la fecha límite se aproxima, definiéndose como los días laborables
          restantes igual o inferiores a tres. Este aviso anticipado permitirá a los usuarios tomar
          acciones oportunas para evitar retrasos.
        **Rojo:** Indica que la fecha límite ha sido superada y que la validación o emisión está
          pendiente, alertando sobre un posible incumplimiento de plazos.
- **Fecha real de validación / emisión:** este indicador muestra cuándo se ha realizado efectivamente
    la validación o se ha emitido el informe, permitiendo comparar la acción realizada con el plazo
    establecido.


```
Página: 51 de 54 Edición: 02
```
```
 Verde: La fecha real se encuentra dentro del plazo, es decir, coincide con la fecha límite o
es anterior a ella, indicando que el proceso se completó puntualmente.
 Rojo: La fecha real es posterior a la fecha límite, reflejando un retraso en la validación o
emisión.
Estos indicadores proporcionarán una visualización rápida y clara del cumplimiento de los plazos
establecidos, facilitando la gestión y toma de decisiones durante el seguimiento de las pruebas.
```
**7.5 Filtros**

```
La pantalla del Control de Pruebas incluirá un panel superior de filtros que permitirá a los usuarios acotar
la visualización de pruebas en función de distintos criterios. Esta funcionalidad facilitará la localización
rápida de pruebas concretas y el seguimiento de aquellas sobre las que cada usuario tenga acciones
pendientes o interés específico.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
El panel estará siempre visible en la parte superior de la pantalla, sin necesidad de navegación adicional,
y permitirá aplicar filtros combinados sobre cualquiera de los campos disponibles en la vista general del
control de pruebas.
Los campos sobre los que se podrán aplicar filtros, junto con el tipo de componente de filtrado previsto para
cada uno, son los siguientes:
```
- **Número de prueba** : campo de texto libre para búsqueda exacta o parcial del identificador (formato
    NNNN/AA).
- **Estado de la prueba** : **selector desplegable** con todos los estados disponibles definidos en el ciclo
    de vida de la prueba. Posibilidad de seleccionar uno, varios o todos los estados.
- **Cliente** : campo de texto libre o **selector con autocompletado** para facilitar la búsqueda por nombre
    o entidad. Posibilidad de seleccionar uno, varios o todos los clientes.
- **Descripción** : campo de texto libre para búsqueda por contenido incluido en la descripción de la
    prueba.
- **Año** : selector que permitirá filtrar las pruebas por el año seleccionado.
- **Tipo de prueba** : **selector desplegable** con todos los tipos de prueba configurados en el sistema.
- **Fecha(s) programada(s)** : **selector de rango de fechas** , que permitirá filtrar por una o varias fechas
    programadas, o un rango de fechas.


```
Página: 52 de 54 Edición: 02
```
```
Todos los filtros podrán combinarse entre sí para afinar los resultados mostrados en pantalla. Se incluirá
también una opción para limpiar todos los filtros con un solo clic.
```
## 8 RESPONSABILIDAD

```
(A rellenar por el INTA)
```
## 9 DIAGRAMA DE FLUJO

```
No aplicable.
```
## 10 PLANTILLAS

```
(A rellenar por el INTA)
```
```
PLANTILLA TITULO
```
```
XXX-YYY-DDDD-NNN-INTA- 01 Nombre de la “ Plantilla 0 1”
```
```
XXX-YYY-DDDD-NNN-INTA- 0 2.... Nombre de la “ Plantilla 02 ”^
```
## 11 ANEXO

**11.1 Anexo I: Tabla de precios para ensayos de fuego**

#### 11.1.1 Tarifas con Medios INTA

(^)

## TABLA ÚNICA DE PRECIOS

## (VIDA ÚTIL TUBO

## 100%) (VIDA ÚTIL TUBO 1/3)

```
Sistemas de
Armas
empleados:
```
```
Medidas/Re
gistros
```
```
Medidas/Registr
os adicionales
1er DISPARO
```
##### DISPARO

##### ADICIONAL

```
1er
DISPARO
```
##### DISPARO

##### ADICIONAL

```
A) Obuses de
155 mm,
cañón de
5"/54 y
Carros de
Combate
```
```
Velocidad,
Presión con
manómetro
y
Acondiciona
```
```
Sin otra
medida/registro 9.741,17 € 1.083,71 € 10.491,25 € 1.833,79 €
```
Vídeo (^) 10.286,29 € 1.124,75 € 11.036,37 € 1.874,83 €
Trayectografía 13.416,76 € 1.145,27 € 14.166,84 € 1.895,35 €
Trayectografía y
video 13.961,89 € 1.186,32 € 14.711,97 € 1.936,40 €


```
Página: 53 de 54 Edición: 02
```
```
miento
incluidos
Velocidad,
Presión con
piezoeléctric
o y
Acondiciona
miento
incluidos
```
```
Sin otra
medida/registro 10.523,15 € 1.030,78 € 11.273,23 € 1.780,86 €
Vídeo 11.068,28 € 1.071,82 € 11.818,36 € 1.821,90 €
```
Trayectografía (^) 14.198,75 € 1.092,35 € 14.948,83 € 1.842,43 €
Trayectografía y
video (^) 14.743,87 € 1.133,39 € 15.493,95 € 1.883,47 €
**B) Obuses de
105 mm,
cañón de
3"/50**
Velocidad,
Presión con
manómetro
y
Acondiciona
miento
incluidos
Sin otra
medida/registro 9.235,05 € 577,58 € 9.402,29 € 744,82 €
Vídeo (^) 9.780,17 € 618,63 € 9.947,41 € 785,87 €
Trayectografía (^) 12.910,64 € 639,15 € 13.077,88 € 806,39 €
Trayectografía y
video (^) 13.455,77 € 680,19 € 13.623,01 € 847,43 €
Velocidad,
Presión con
piezoeléctric
o y
Acondiciona
miento
incluidos
Sin otra
medida/registro 10.017,03 € 524,65 € 10.184,27 € 691,89 €
Vídeo (^) 10.562,15 € 565,70 € 10.729,39 € 732,94 €
Trayectografía (^) 13.692,62 € 586,22 € 13.859,86 € 753,46 €
Trayectografía y
video (^) 14.237,75 € 627,27 € 14.404,99 € 794,51 €
**C) Cañón
76/62**
Velocidad,
Presión con
manómetro
y
Acondiciona
miento
incluidos
Sin otra
medida/registro 10.132,91 € 1.475,45 € 10.841,36 € 2.183,90 €
Vídeo (^) 10.678,03 € 1.516,49 € 11.386,48 € 2.224,94 €
Trayectografía 13.808,50 € 1.537,02 € 14.516,95 € 2.245,46 €
Trayectografía y
video (^) 14.353,63 € 1.578,06 € 15.062,08 € 2.286,51 €
**D) Morteros
y Calibres
medios**
Velocidad,
Presión con
piezoeléctric
o y
Acondiciona
miento
incluidos
**Medidas/Registr
os
1er DISPARO**

##### DISPARO

##### ADICIONAL

```
1er
DISPARO
```
##### DISPARO

##### ADICIONAL

```
Sin otra
medida/registro 9.723,82 € 210,04 € 9.725,16 € 211,37 €
```
Vídeo (^) 10.514,04 € 236,36 € 10.515,38 € 237,69 €
Trayectografía (^) 13.380,04 € 249,52 € 13.381,37 € 250,85 €
Trayectografía y
video 14.170,26 € 275,84 € 14.171,59 € 277,17 €

#### 11.1.2 Tarifas con Medios Ajenos del INTA

(^)
TABLA ÚNICA DE PRECIOS
Sistemas de Armas
empleados: Medidas/Registros^
Medidas/Registros
adicionales^ **1er DISPARO**^

##### DISPARO

##### ADICIONAL

A) Obuses de 155
mm, cañón de 5"/54
y Carros de
Combate

```
Velocidad, Presión
con manómetro y
Acondicionamiento
incluidos
```
```
Sin otra
medida/registro 9.007,89 € 350,43 €
Vídeo 9.811,03 € 391,47 €
Trayectografía 12.683,48 € 411,99 €
```

```
Página: 54 de 54 Edición: 02
```
```
Trayectografía y
video 13.486,63 € 453,04 €
```
B) Obuses de 105
mm, cañón de 3"/50

```
Velocidad, Presión
con manómetro y
Acondicionamiento
incluidos
```
```
Sin otra
medida/registro 9.007,89 € 350,43 €
Vídeo 9.811,03 € 391,47 €
Trayectografía 12.683,48 € 411,99 €
Trayectografía y
video 13.486,63 € 453,04 €
```
C) Cañón 76/62

```
Velocidad, Presión
con manómetro y
Acondicionamiento
incluidos
```
```
Sin otra
medida/registro 9.007,89 € 350,43 €
Vídeo 9.811,03 € 391,47 €
Trayectografía 12.683,48 € 411,99 €
Trayectografía y
video 13.486,63 € 453,04 €
```
D) Morteros y
Calibres medios

```
Velocidad, Presión
con manómetro y
Acondicionamiento
incluidos
```
```
Medidas/Registros 1er DISPARO DISPARO
ADICIONAL
Sin otra
medida/registro 8.949,71 € 258,87 €
Vídeo 9.741,55 € 285,13 €
Trayectografía 12.608,35 € 298,26 €
Trayectografía y
video 13.400,18 € 324,53 €
```

