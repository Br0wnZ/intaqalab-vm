```
Página: 1 de 37 Edición: 0 X
```
**ANÁLISIS FUNCIONAL INTAQALAB PLANIFICACIÓN**

#### NOMBRE FIRMA Y FECHA

```
PREPARADO POR
Knowmadmood
```
```
REVISADO POR
```
```
Nombre persona 1 que revisa
Dependencia/Cargo Persona 1
Nombre persona 2 que revisa
Dependencia/Cargo Persona 2
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
02 01/2026 Actualización del documento, así como las pantallas en base a los comentarios facilitados.
```
```
03 06/2026 Actualización del documento, así como las pantallas en base a los comentarios facilitados.
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


## Página: 2 de 37 Edición: 0 X

- 1 INTRODUCCIÓN ÍNDICE
   - 1.1 Objeto
   - 1.2 Alcance
   - 1.3 Abreviaturas
   - 1.4 Definiciones
- 2 DOCUMENTACIÓN
   - 2.1 Documentos de requisitos legales
   - 2.2 Documentos aplicables
   - 2.3 Documentos de referencia
- 3 PLANIFICACIÓN GENERAL
   - 3.1 Campos de la pestaña de planificación general
   - 3.2 Gestión de series y disparos
- 4 CONDICIONES DEL DISPARO
   - 4.1 Estructura y comportamiento de la sección Condiciones del disparo
   - 4.2 Tabla de Condiciones del disparo
- 5 MUNICIONES
   - 5.1 Estructura y comportamiento de la sección Municiones
   - 5.2 Asignación de Municiones
- 6 ARMAMENTO
   - 6.1 Estructura y comportamiento de la sección Armamento
   - 6.2 Tabla de Armamento
- 7 MEDIDAS Y REGISTROS
   - 7.1 Estructura y comportamiento de la sección Medidas y registros
   - 7.2 Selección de medidas y registros
- 8 VALIDACIÓN DE LA PLANIFICACIÓN
   - 8.1 Proceso de validación
   - 8.2 Generación del catálogo de ensayos.................................................................................................................
- 9 RESPONSABILIDAD
- 10 DIAGRAMA DE FLUJO
- 11 PLANTILLAS
- 12 ANEXO I


```
Página: 3 de 37 Edición: 0 X
```
## 1 INTRODUCCIÓN ÍNDICE

```
Una vez creada la prueba desde el módulo de Gestión de Pruebas , el apartado de Planificación estará
accesible desde la ficha de una prueba concreta. Para llegar a esta vista, el usuario podrá:
```
- Hacer clic sobre una prueba desde el **Calendario de pruebas de fuego** , o
- Hacer clic sobre una prueba desde el **listado de pruebas** disponible en la sección **Pruebas de**
    **Fuego** , dentro del menú de **Gestión de Pruebas**.
Ambas opciones abrirán la **Ficha de la prueba** , la cual funcionará como una vista principal con **pestañas
horizontales** para navegar entre las distintas fases del proceso:
- **Información General**
- **Planificación**
- **Ejecución**
- **Análisis**
Al seleccionar la pestaña **Planificación** , se desplegarán una serie de **subpestañas** que organizan la
información de manera estructurada, por áreas funcionales. Estas subpestañas permitirán introducir,
consultar y actualizar los datos relacionados con la planificación de la prueba. Las subpestañas disponibles
son las siguientes:
- **General**
- **Condiciones del disparo**
- **Municiones**
- **Armamento**
- **Medidas y registros**
La subpestaña **General** está destinada a gestionar toda la información que afecta de manera transversal a
la prueba, es decir, al conjunto del ensayo como entidad global. Además, permitirá gestionar las series y
disparos de la prueba. En las demás subpestañas, la información podrá vincularse a cada disparo o
ejecución específica, según corresponda.
El contenido del apartado **Planificación** será **visible para todos los usuarios una vez la planificación
haya sido validada**. No obstante, **solo los usuarios pertenecientes al departamento de Planificación
y Análisis** y **Jefatura de Ensayos** podrán **modificar, añadir o eliminar información** en cualquiera de las
subpestañas.
Para reforzar esta lógica de permisos, los campos se mostrarán como activos o bloqueados (solo lectura)
según el rol del usuario conectado, con estilos visuales diferenciados.

### 1.1 Objeto

```
El presente documento funcional tiene como objetivo describir de forma detallada el módulo de Planificación
dentro de la aplicación INTAQAlab , desarrollada para la gestión integral de pruebas de fuego en el entorno
del Centro de Ensayos de Torregorda (CET).
Este módulo forma parte del sistema de gestión de ensayos y está orientado a facilitar la planificación de las
pruebas solicitadas por los clientes. Determinando la munición y el arma que se empleará durante la ejecución
del ensayo de fuego, así como las magnitudes y medidas que se desean medir durante el desarrollo de este.
```
### 1.2 Alcance


```
Página: 4 de 37 Edición: 0 X
```
```
El documento recoge los requisitos funcionales, los flujos de trabajo, los perfiles implicados, y las
acciones disponibles en cada fase del ciclo de vida de una prueba, garantizando la trazabilidad de todas
las operaciones realizadas por los usuarios.
Este análisis funcional servirá como base para el desarrollo, validación y evolución del sistema, asegurando
que las necesidades operativas del CET se vean reflejadas en la solución tecnológica propuesta.
```
### 1.3 Abreviaturas

```
No aplicable.
```
### 1.4 Definiciones

```
No aplicable.
```
## 2 DOCUMENTACIÓN

```
Todos los documentos citados sin fecha o edición serán aplicables en su última edición.
```
### 2.1 Documentos de requisitos legales

```
No aplicable.
```
### 2.2 Documentos aplicables

```
(A rellenar por INTA si aplica)
```
### 2.3 Documentos de referencia

```
No aplicable.
```
## 3 PLANIFICACIÓN GENERAL

### 3.1 Campos de la pestaña de planificación general

```
La subpestaña General dentro del apartado de Planificación agrupa toda la información que afecta de
manera transversal a la prueba, es decir, que no está asociada a disparos o ejecuciones específicas, sino
al conjunto del ensayo como entidad global. Además, desde esta pestaña se podrán configurar las series
y disparos de la prueba. Esta sección será la primera visible al acceder a la pestaña de Planificación.
```

```
Página: 5 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Esta pestaña incluirá los siguientes campos:

1. **Objeto de la prueba.** Campo de texto libre obligatorio. Se emplea para describir la finalidad general o
    el objetivo principal del ensayo.
2. **Espécimen.** Campo obligatorio donde el usuario seleccionará las armas, tubos y denominaciones que
    van a intervenir en el ensayo de fuego. Para seleccionar dichos elementos, se dispondrá de un botón
    **_Gestionar Espécimen,_** que abrirá en una ventana emergente donde contará con:
       2.1. _Desplegable “Tipo de espécimen” con las opciones Arma, Mortero, Tubo y Munición._
       2.2. En función del tipo de espécimen seleccionado anteriormente, se mostrarán las **armas y**
          **tubos** registrados en Calibry así como las **denominaciones de munición** registradas en el
          sistema. En función del tipo de registro se seleccione del desplegable, el sistema le solicitará:
             2.2.1. **Nº serie** , campo opcional donde informará el número de serie del arma y/o
                tubo seleccionado.
             2.2.2. **Lote** , campo opcional donde informará el lote de la denominación
                seleccionada.


```
Página: 6 de 37 Edición: 0 X
```
```
2.3. Mediante el botón Añadir , los datos seleccionados se incorporarán a una lista en la que se
mostrará la información de los registros que componen el espécimen a medida que se van
seleccionando, permitiendo además eliminar cualquiera de ellos mediante la acción de
borrado disponible.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
En dicha ventana emergente podrá agregar o eliminar todas las denominaciones, armas y tubos que
intervengan en el ensayo de fuego, así como sus correspondientes números de serie y lote
respectivamente. Una vez haya seleccionado todos los elementos que intervienen podrá, mediante el
botón Guardar, registrar dicha selección que se mostrará en el campo Espécimen de la pestaña
General.
```
3. **Parámetros de control de fechas.** Este bloque agrupa los parámetros que rigen los plazos clave del
    cierre de prueba y la elaboración del informe. Los datos introducidos servirán para calcular las fechas
    límites descritas en el apartado _Cálculo de fechas límite_ de documento _Control administrativo_. Incluirá
    los siguientes apartados numéricos:
       3.1. **Máximos días para emisión de informe.** Número total de días disponibles desde la
          finalización del tiro hasta la fecha de entrega del informe al cliente. Por defecto: 20 días.
       3.2. **Porcentaje para unidades técnicas.** Porcentaje del tiempo total asignado destinado a que
          las distintas unidades técnicas realicen sus validaciones. Por defecto: 40%.
       3.3. **Porcentaje para fin de prueba.** Porcentaje del total que debe haberse consumido para que
          el informe esté firmado por el **jefe del centro** y **emitido al cliente**. Por defecto: 60%.
       3.4. **Días para firma del informe.** Días de margen necesarios para que el jefe del centro firme el
          informe final. Se restarán de la fecha límite de fin para determinar la fecha límite de
          elaboración del informe. Por defecto: 1 día.
4. **Usuario planificación.** Usuario asignado para la elaboración de la planificación de la prueba. Será un
    campo desplegable en el que se podrán seleccionar todos los usuarios con rol de Planificación y
    Análisis. Únicamente el usuario asignado podrá crear la planificación de la prueba y realizar las


```
Página: 7 de 37 Edición: 0 X
```
```
modificaciones que estime. Un usuario solo podrá asignarse a sí mismo. El Jefe de Planificación y
Análisis podrá asignarse a sí mismo o a cualquier usuario con rol de Consultor de Ensayos.
```
5. **Fecha de ejecución programada:** Campo fecha que se actualizará automáticamente cuando un
    usuario programe la prueba desde el Calendario de Pruebas de Fuego. Este campo puede contener
    múltiples fechas. Cada fecha debe ir acompañada de la línea de fuego en la que ha sido programada,
    en el siguiente formato: **Ejemplo:** _24/10/2025 – L1._
6. **Revisión hipocelométrica antes de la prueba:** Checkbox que permita indicar si el cliente solicita
    incluir en el informe de resultados información sobre el desgaste del tubo ates de la realización de la
    prueba.
7. **Revisión hipocelométrica después de la prueba:** Checkbox que permita indicar si el cliente solicita
    incluir en el informe de resultados información sobre el desgaste del tubo después de la realización de
    la prueba.
8. **Observaciones.** Campo de texto libre multilínea. Permite introducir comentarios adicionales,
    aclaraciones o información relevante relacionada con la planificación general de la prueba.
9. **Requisitos para aprobación o rechazo de los resultados.** Campo de texto libre multilínea. Se
    utilizará para detallar los criterios no cuantificables que deben cumplirse para que los resultados del
    ensayo sean considerados válidos o sean rechazados.
10. **Requisitos meteorológicos.** Desplegable con los criterios registrados en el catálogo criterios
    STANAG, en Administración del sistema.
11. **Información adicional del cliente.** Campo de texto libre multilínea. Permite registrar datos
    complementarios relevantes aportados por el cliente.
12. **Criterios de Calificación.** _Se podrá habilitar la siguiente tabla mediante el checkbox “_ Mostrar Criterios
    de Calificación _”_. Permite registrar rangos de valores numéricos para calificar una munición. El usuario
    podrá introducir los valores en la siguiente tabla:
       **Propiedad Útil- 1 Inútil**
       **V 0 c** Min-máx Min-máx
       **V̄ 0 c**
       **σV0c**
       **P**
       **P̄**
       **Fallos Proyectil**
       **Fallos Espoleta**
       **Fallos Estopín**

Junto a la tabla se incluirán dos selectores de unidades de velocidad y de presión. Además, se
_incluirá un botón “información” con el siguie_ nte texto explicativo:

**_Criterios de Calificación_**

_Un valor se clasifica como_ **_Útil- 1_** _si está dentro del rango Útil-1._

_Un valor se clasifica como_ **_Inútil_** _si está fuera del rango Inútil._

_Cualquier valor que esté dentro del rango Inútil pero fuera del rango Útil-1 se clasifica como_ **_Útil- 2_**_._

Además, en la subpestaña **General** estará habilitado un botón **Validar** que permitirá gestionar el proceso
de validación de la planificación de la prueba, cuya lógica detallada se describe en el apartado **Validación
de la planificación**.


```
Página: 8 de 37 Edición: 0 X
```
```
Una vez la planificación ha sido validada, estará disponible el botón Modificar planificación que permitirá
realizar cambios sobre la planificación validada. Este botón solamente estará disponible para los perfiles
autorizados para realizar dichos cambios.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
### 3.2 Gestión de series y disparos

```
Para gestionar las series y disparos, se realizará desde la subpestaña Serie y disparo dentro del apartado
de Planificación. Desde la cual se podrá realizar todo el proceso que se describe a continuación.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```

```
Página: 9 de 37 Edición: 0 X
```
- Crear, modificar y eliminar series de pruebas.
- Añadir y eliminar disparos dentro de cada serie.
- Asociar información relevante a cada disparo para su correcta identificación y seguimiento.
- **Visualizar las series y disparos en una tabla estructurada** que facilite la navegación y edición.

```
Proceso de creación, visualización, modificación y eliminación de series y disparos
```
1. **Creación de una nueva serie**
    - En la interfaz de la pestaña que aparece tras clicar **“Series y Disparos”** , se mostrará un botón
       claramente identificado como **“Crear serie”.**

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
- Al pulsar este botón, el usuario accederá al formulario de creación donde se solicitará introducir:
     **Nombre de la serie** : campo de texto libre obligatorio para identificar la serie.
     **Número de disparos** : campo numérico obligatorio que indicará la cantidad de disparos que
       contendrá la serie.
     **Observaciones** : campo de texto libre opcional.
- Tras confirmar, se generará la serie con el nombre indicado y se crearán los disparos asociados,
    numerados automáticamente de forma continuada a lo largo de toda la prueba. Por ejemplo:
        Si la primera serie contiene 5 disparos, estos se numerarán como _Disparo 1_ a _Disparo 5_.
        Si a continuación se crea una segunda serie con 3 disparos, estos se numerarán como
          _Disparo 6_ a _Disparo 8_.
2. **Visualización en tabla única con agrupación**


```
Página: 10 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
La interfaz mostrará la información en **una única tabla** que agrupa las series y sus disparos asociados. La
estructura será la siguiente:

- **Cabecera de la tabla** :
     **Nombre de la serie** : texto identificativo definido por el usuario.
     **Orden de ejecución** : número ordinal generado automáticamente que indica la posición
       secuencial de la serie.
     **Observaciones** : campo de texto editable para añadir comentarios generales sobre la serie.
     **Acciones** : iconos para editar, eliminar o reorganizar la serie. Seleccionando el icono de
       reorganizar la serie, permite al usuario mover la serie seleccionada a la posición deseada,
       recalculando el valor del campo orden de ejecución en función de la posición que ocupe
       dentro de la secuencia de la serie.
- **Filas de series** : Cada serie se muestra en una fila principal.
- **Filas de disparos (agrupadas bajo cada serie)** :
    Debajo de cada serie se listan los disparos asociados, con las siguientes columnas:
        **N.º del disparo** : valor numérico global generado automáticamente (Disparo 1, Disparo 2,
          etc.), que no se reinicia con cada serie.
        **Observaciones** : campo de texto editable para registrar información específica del disparo.
        **Acciones** : iconos para editar o eliminar el disparo.
- **Botones de acción** :
     **Crear serie** : disponible en la parte superior de la tabla para añadir una nueva serie.


```
Página: 11 de 37 Edición: 0 X
```
```
 Añadir disparo : disponible dentro de cada grupo de serie para agregar disparos asociados.
Se podrá informar el número de disparos que se desean añadir a la serie, por defecto se
añadirá 1 disparo.
```
3. **Modificación de series y disparos**

**Gestión de disparos dentro de una serie** :

- El usuario podrá añadir disparos adicionales a una serie mediante el botón **“Añadir disparo”** ,
    informará el número de disparos que desea agregar (por defecto 1 disparo). Se generarán los
    disparos deseados en la serie incrementando su numeración dentro de la serie. Para el resto de las
    series, si existen, se actualizará la numeración de los disparos teniendo en cuenta el número de
    nuevos disparos que se han incluido. Por ejemplo, si tenemos la serie 1 con 3 disparos (d1, d2, d3)
    y la serie 2 con 2 disparos (d4, d5). Si añadimos 3 disparos adicionales a la serie 1, quedaría con los
    disparos d1, d2, d3, d4, d5, d6 y en la serie 2 los disparos pasarían a ser d7 y d8.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
- Para eliminar un disparo, se deberá utilizar el icono de eliminación en la fila correspondiente. Esta
    acción pedirá confirmación para evitar errores. El número de disparo se recalculará automáticamente
    tras eliminar un disparo. Por motivos de trazabilidad, se registrará el usuario que realiza la acción,
    así como la fecha y hora.


```
Página: 12 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
- Tras cualquier eliminación o adición, en la fase de planificación de la prueba, el sistema actualizará
    la numeración de forma automática, manteniendo la secuencia global de disparos dentro de la
    prueba.

**Eliminación de una serie completa** :

- La eliminación de una serie se podrá realizar mediante el icono correspondiente en la fila de la serie.
    El orden de ejecución de las series deberá recalcularse automáticamente, así como el número de
    disparos de las series que se mantienen en la prueba.
- Al eliminar una serie, se eliminarán todos sus disparos asociados. Esta acción requerirá confirmación
    por parte del usuario para evitar pérdidas de datos accidentales. Por motivos de trazabilidad, se
    registrará el usuario que realiza la acción, así como la fecha y hora.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
Las series y disparos que se configuren en esta ventana de gestión quedarán reflejados
automáticamente en la tabla de las pestañas Condiciones del Disparo, Municiones, Armamento y
Medidas.
```

```
Página: 13 de 37 Edición: 0 X
```
## 4 CONDICIONES DEL DISPARO

```
La sección Condiciones del Disparo permitirá añadir información relevante ligada a cada disparo, como
la fecha prevista , el tipo de blanco , las características específicas del blanco a colocar y
observaciones adicionales.
```
### 4.1 Estructura y comportamiento de la sección Condiciones del disparo

```
Al acceder a la pestaña “Condiciones del disparo”, el sistema mostrará las series asociadas a la prueba
en formato de lista desplegable. Cada serie se presenta como un bloque colapsado que el usuario puede
expandir para visualizar los disparos asociados. Al expandir una serie, se muestra una tabla con los
disparos y sus parámetros configurables.
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
El usuario podrá:
```
- **Asignar condiciones del disparo** a nivel de serie. Dichas condiciones se aplicarán
    automáticamente a todos los disparos que la componen.
- **Modificar las condiciones de un disparo individual** en caso necesario, sin que dichos cambios
    afecten al resto de disparos ni a la serie.
- **Aplicar la configuración de forma masiva** mediante el botón **“Aplicar configuración masiva”**. Al
    pulsar este botón, se abrirá una pantalla donde el usuario podrá:
       1. Seleccionar las **series** a las que desea aplicar la configuración.
       2. Definir los parámetros que se aplicarán.
       3. Confirmar la acción mediante el botón **Aplicar** o cancelar la operación.


```
Página: 14 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
Comportamiento esperado
```
- Cuando el usuario asigna condiciones a una serie, estas se aplicarán automáticamente a todos los
    disparos que la integran.
- Si el usuario utiliza el botón **“Aplicar configuración masiva”** :
     Puede aplicarlas a toda la prueba.
     Puede aplicarlas únicamente a una o varias series concretas.
- Cuando se extienden condiciones, estas **sobrescriben** las condiciones previamente asignadas en
    las series/disparos seleccionados si se había modificado la tabla anteriormente.
- La modificación de condiciones a nivel de disparo no se propagará a la serie ni al resto de disparos.
La opción **“Aplicar configuración masiva”** deberá implementarse como un elemento de interfaz
claramente visible.

### 4.2 Tabla de Condiciones del disparo

```
En la sección “Condiciones del disparo” , se mostrará una lista de series en formato desplegable , cada
una con sus disparos asociados. Cada serie aparece como un bloque colapsado que el usuario puede
expandir para ver los disparos. Al expandir una serie, se muestra una tabla con los disparos asociados.
```

```
Página: 15 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Las tablas están organizadas de la siguiente manera:

- **Filas:** Representan cada uno de los disparos de la prueba.
- **Columnas:** Contienen los campos clave asociados a cada disparo y serie.

Los campos visibles en las tablas son:

- **Serie** : número ordinal generado automáticamente que indica el orden de ejecución de la serie dentro
    de la prueba.
- **Nombre serie** : campo de texto definido por el usuario para identificar la serie.
- **Disparo** : número global del disparo, asignado automáticamente de forma secuencial a lo largo de
    toda la prueba (no se reinicia con cada serie).
- **Fecha** : por defecto se mostrará la fecha seleccionada en el **Calendario de Pruebas de Fuego** al
    crear la prueba. En caso de que se hayan asignado varios días a la prueba en el calendario, se
    asignará por defecto **el primero de ellos**. Este campo será editable, pudiendo seleccionar
    únicamente las fechas programadas en el calendario para esa prueba.
- **Zona de impacto** : selector desplegable (obligatorio) que permitirá elegir entre las zonas de impacto
    disponibles:
        Mar
        Arenero
- **Blanco** : selector desplegable que permitirá elegir entre los tipos de blanco disponibles:
     Plancha
     Precisión
     Virtual
     Proximidad
     Infrarrojo
- **Características del blanco a colocar** : subdivididas en tres campos específicos, que serán editables
    para cada disparo:
        **Material**
        **Dimensiones (ancho-alto, diámetro)**
        **Espesor**
        **Distancia**
        **Inclinación**
- **Ángulo Tiro:** campo numérico (decimal) que indica el ángulo de elevación del arma en milésimas.
    Debe permitir valores decimales.


```
Página: 16 de 37 Edición: 0 X
```
- **Orientación:** campo numérico (decimal) que representa la orientación horizontal del arma en
    milésimas. Debe permitir valores decimales.
- **Elevación** : Campo numérico (decimal) que indica la altura relativa del arma o punto de disparo
    respecto a un plano de referencia. Debe permitir valores decimales.
- **Alcance solicitado** : Campo numérico (entero) que indica la distancia prevista o solicitada al objetivo,
    expresada en metros.
- **Altura de funcionamiento** : Campo numérico (entero) que especifica la altura vertical, en metros, a
    la cual se prevé el funcionamiento.
- **Peso de pólvora** : campo numérico (entero), que indica el peso de pólvora planificado para las series
    de tarado, expresado en gramos.
- **Peso de proyectil** : campo numérico (entero), que indica el peso de proyectil informado por el cliente,
    expresado en gramos.
- **Velocidad nominal:** campo numérico (decimal), que indica la velocidad buscada, expresada en m/s.
- **Observaciones** : campo de texto libre para introducir comentarios o información adicional relacionada
    con el disparo.
Todos los campos configurados como desplegables en la tabla (en este caso, _Blanco_ ) deberán ser
totalmente configurables. Es decir, un usuario con rol de **Administrador** podrá añadir nuevos valores o
eliminar los existentes para mantener actualizada la lista de opciones disponibles. Estas acciones se
llevarán a cabo en el apartado _Administración del sistema, Gestión de los campos desplegables en
planificación._
En la pantalla estarán disponibles los siguientes botones para gestionar la información:
- **Cancelar:** Permite descartar los cambios realizados y volver al estado anterior sin guardar la
información introducida.
- **Guardar borrador:** Guarda la información introducida hasta el momento sin necesidad de completar
el registro. El contenido quedará almacenado como borrador y podrá ser editado posteriormente.

## 5 MUNICIONES

```
Esta sección permitirá planificar y gestionar diferentes aspectos relacionados con la munición que se
utilizará en la prueba, sus características y su acondicionamiento.
```
### 5.1 Estructura y comportamiento de la sección Municiones

```
Al acceder a la pestaña Municiones , el sistema mostrará las series creadas para la prueba en forma de
listado desplegable para cada una de las series que componen la prueba (Serie 1, Serie 2, etc.).
```

```
Página: 17 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Para cada serie, el usuario podrá:

- Consultar el **nombre de la serie** y el **número de disparos** asociados.
- **Asignar munición a nivel de serie** (tipo, características y acondicionamiento) mediante el botón
    **“Añadir configuración”** se podrá asignar la misma configuración a todos los disparos que
    componen la serie o a un disparo en concreto de la misma**.**
- **Aplicar la configuración de forma masiva** mediante el botón **“Aplicar configuración masiva”**. Al
    pulsar este botón, se abrirá una pantalla donde el usuario podrá:
        Seleccionar las **series** a las que desea aplicar la configuración.
        Definir los parámetros que se aplicarán.
        Confirmar la acción mediante el botón **Aplicar** o cancelar la operación.


```
Página: 18 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
### 5.2 Asignación de Municiones


```
Página: 19 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
En la sección **Municiones** , se mostrará en forma de lista desplegable cada una de las series que componen
la prueba. Al acceder a cada serie, el usuario visualizará la siguiente información:

- **Nombre serie:** campo de texto definido por el usuario para identificar la serie.
- **Disparos:** número de disparos que componen a serie.

Junto a la información de la serie, se habilitará el botón **“Añadir configuración”.** Este botón permite
incorporar una nueva configuración de munición dentro de la serie seleccionada. Cada configuración de
munición se entiende como un conjunto de componentes de munición. Un disparo de la serie podrá tener
asignada una única configuración de munición. Para la configuración añadida, el usuario podrá completar la
siguiente información:

- **Tipo** : Desplegable con los elementos de la categoría _“_ munición _”_ disponibles en el maestro Gestión
    de Tipos de Munición (disparo organizado y granada de mortero).
- **Denominación** : Desplegable con buscador predictivo que muestra todas las denominaciones
    disponibles en el sistema para el elemento seleccionado anteriormente. Estas denominaciones se
    gestionarán desde el módulo de Gestión de Almacén, en el maestro Gestión de Denominaciones.
- **Lote** : Campo de texto para indicar el lote correspondiente.
- **Disparos asociados** : lista desplegable que permite seleccionar los disparos de la serie a los que se
    asocia la configuración. Por defecto, estarán todos seleccionados.
- **Nº de cliente** : se podrán introducir tantos números de cliente como disparos asociados tenga la
    configuración, separados por comas.
- **Observaciones** : Campo de texto libre para incluir anotaciones relevantes.


```
Página: 20 de 37 Edición: 0 X
```
- **Casilla Acondicionamiento** : Al seleccionar la casilla de Acondicionamiento, se despliega un bloque
    adicional con los siguientes campos específicos para configurar las condiciones del
    acondicionamiento de la munición:
        **Temperatura acondicionamiento** : Valor numérico que indica la temperatura en grados
          centígrados (ºC) a la que se acondiciona la munición.
        **Tolerancia** : Margen aceptable de variación en grados centígrados (ºC) respecto a la
          temperatura de acondicionamiento.
        **Tiempo mínimo** : Tiempo mínimo, medido en horas, que la munición debe permanecer bajo
          las condiciones establecidas. Por defecto, se establecen 24h.
        **Tiempo máximo** : Tiempo máximo, medido en horas, permitido antes de que la munición
          pueda verse afectada.
        **Observaciones** : Campo de texto libre para incluir anotaciones relevantes sobre el proceso
          de acondicionamiento.

Los campos de acondicionamiento correspondientes a temperatura se resaltarán con colores, azul
cuando los valores sean inferiores a 0 ºC , verde si la temperatura se encuentra entre 0 y 21 ºC y naranja
si la temperatura es superior a 21 ºC


```
Página: 21 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Junto a la información del disparo previamente añadido, se mostrará un desplegable con los tipos de
componentes de munición dados de alta en el sistema en el módulo de _Gestión de componentes de munición_ ,
detallado en el documento funcional _Gestión de almacén de munición_.


```
Página: 22 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Los tipos de componentes de munición se podrán gestionar en el módulo de Administración del sistema,
Componentes de Munición.

Por cada opción seleccionada, el sistema generará un bloque con la siguiente información:

- **Componente:** campo no editable que indica el tipo de componente seleccionado.
- **Denominación:** desplegable con buscador predictivo que mostrará las denominaciones del
    componente seleccionado dadas de alta en el sistema.
- **Lote:** Campo de texto para indicar el lote correspondiente.
- **Observaciones:** Campo de texto libre para incluir anotaciones relevantes.
- **Número máximo de fallos permitido,** campo numérico donde se informará el número máximo de
    fallos permitidos, que se empleará como criterio para evaluar la aprobación y/o rechazado del
    componente empleado en la prueba.
- **Casilla Acondicionamiento** : mismo funcionamiento y campos que en el disparo.


```
Página: 23 de 37 Edición: 0 X
```
_La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo._

- Para el caso específico de la **espoleta** , el bloque incluirá también:
     **Modo funcionamiento espoleta** (Instantáneo _–_ SQ, Retardo _–_ DLY, A tiempos, Impacto,
       Proximidad) con los campos del maestro Modo Funcionamiento de Espoleta.
     **Graduación espoleta,** numérico.
- Para el caso específico del componente **Suplementos** , el bloque incluirá también el campo
    **Cantidad.**
- Para el caso específico del componente **Carga de proyección** , el bloque incluirá también el campo
    desplegable **Zona/Módulos,** que mostrará los valores registrados en el maestro Zonas de Carga
    para la carga seleccionada anteriormente.


```
Página: 24 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
Todos los campos configurados como desplegables en la tabla (en este caso, Denominaciones de disparos
y componentes y modo de funcionamiento de la espoleta) deberán ser totalmente configurables. Es decir,
un usuario con rol de Administrador podrá añadir nuevos valores o eliminar los existentes para mantener
actualizada la lista de opciones disponibles. Estas acciones se llevarán a cabo en el apartado Gestión de
Almacén, Gestión de denominaciones.
En la pantalla estarán disponibles los siguientes botones:
```
- **Cancelar** : Permite descartar los cambios realizados y volver al estado anterior sin guardar la
    información introducida.
- **Guardar borrador** : Guarda la información introducida hasta el momento sin necesidad de completar
    el registro. El contenido quedará almacenado como borrador y podrá ser editado posteriormente.
La munición asociada a cada disparo, incluidos sus componentes, se mostrará automáticamente en la
pantalla de ejecución de la prueba. Los usuarios con rol **“Municiones”** podrán modificar estos campos.
Esta funcionalidad se describirá en detalle en el documento **Ejecución de la Prueba**.

## 6 ARMAMENTO

```
La sección Armamento permitirá planificar el arma y el tubo que se usarán en la prueba. Generalmente,
estos serán los mismos para toda la prueba, pero se deberá poder asignar un arma y tubo diferente a cada
serie o disparo si así se requiere.
```
### 6.1 Estructura y comportamiento de la sección Armamento

```
Al acceder a la pestaña Armamento , el sistema mostrará las series asociadas a la prueba en formato de
lista desplegable. Cada serie se presenta como un bloque colapsado que el usuario puede expandir para
visualizar los disparos asociados. Al expandir una serie, se muestra una tabla con los disparos y sus
parámetros configurables.
```

```
Página: 25 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
El usuario podrá:

- Asignar **condiciones del armamento** a nivel de **serie**. Estas condiciones se aplicarán
    automáticamente a todos los disparos que la componen.
- Modificar las **condiciones del armamento** de un **disparo individual** sin que dichas modificaciones
    afecten al resto de disparos ni a la serie.
- **Aplicar la configuración de forma masiva** mediante el botón **“Aplicar configuración masiva”**. Al
    pulsar este botón, se abrirá una pantalla donde el usuario podrá:
        Seleccionar las **series** a las que desea aplicar la configuración.
        Definir los parámetros que se aplicarán.
        Confirmar la acción mediante el botón **Aplicar** o cancelar la operación.


```
Página: 26 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
Comportamiento esperado
```
- Cuando el usuario asigna condiciones a una serie, estas se aplicarán automáticamente a todos los
    disparos que la integran.
- Si el usuario utiliza el botón **“Aplicar configuración masiva”** :
     Puede aplicarlas a toda la prueba.
     Puede aplicarlas únicamente a una o varias series concretas.
- Cuando se extienden condiciones, estas **sobrescriben** las condiciones previamente asignadas en
    las series/disparos seleccionados.
- La modificación de condiciones a nivel de disparo no se propagará a la serie ni al resto de disparos.
La opción **“Aplicar configuración masiva”** deberá implementarse como un elemento de interfaz
claramente visible.

### 6.2 Tabla de Armamento

```
Se mostrará una lista de series en formato desplegable , cada una con sus disparos asociados. Cada
serie aparece como un bloque colapsado que el usuario puede expandir para ver los disparos. Al expandir
una serie, se muestra una tabla con los disparos asociados.
```

```
Página: 27 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Las tablas están organizadas de la siguiente manera:

- **Filas:** Representan cada uno de los disparos de la prueba.
- **Columnas:** Contienen los campos clave asociados a cada disparo y serie.

Los campos visibles en las tablas son:

- **Serie:** número ordinal generado automáticamente que indica el orden de ejecución de la serie dentro
    de la prueba.
- **Nombre serie:** campo de texto definido por el usuario para identificar la serie.
- **Disparo:** número global del disparo, asignado automáticamente de forma secuencial a lo largo de
    toda la prueba (no se reinicia con cada serie).
- **Denominación de arma:** desplegable con buscador predictivo para indicar la denominación del arma
    a utilizar. Este campo se alimentará de las armas dadas de alta en Calibry.
- **Número de tubo:** desplegable con buscador predictivo para indicar la denominación del tubo a
    utilizar. Este campo se alimentará de los tubos dados de alta en Calibry.
- **Instrumentado:** selector con valores **Sí** o **No** , que indica si el tubo está instrumentado con sensores
    piezoeléctricos.
- **Porcentaje de vida útil:** campo numérico para describir el desgaste o la condición actual del tubo.
    Si previamente se ha seleccionado el número de tubo, este campo quedará bloqueado y no se podrá
    introducir información.
- **Observaciones:** campo de texto libre para añadir cualquier anotación relevante relacionada con la
    serie o disparo.

Todos los campos configurados como desplegables en la tabla (en este caso, _Denominación de arma,
Denominación de tubo_ e _Instrumentado)_ deberán ser totalmente configurables. Es decir, un usuario con rol
de **Administrador** podrá añadir nuevos valores o eliminar los existentes para mantener actualizada la lista
de opciones disponibles. Estas acciones se llevarán a cabo en el apartado _Administración del sistema,
Gestión de los campos desplegables en planificación._

En la pantalla estarán disponibles los siguientes botones para gestionar la información:


```
Página: 28 de 37 Edición: 0 X
```
- **Cancelar:** Permite descartar los cambios realizados y volver al estado anterior sin guardar la
    información introducida.
- **Guardar borrador:** Guarda la información introducida hasta el momento sin necesidad de completar
    el registro. El contenido quedará almacenado como borrador y podrá ser editado posteriormente.
El armamento asociado a cada disparo se mostrará automáticamente en la pantalla de ejecución de la
prueba. Los usuarios con rol **“Armamento”** podrán modificar estos campos. Esta funcionalidad se
describirá en detalle en el documento **Ejecución de la Prueba**.

## 7 MEDIDAS Y REGISTROS

```
El apartado Medidas y registros dentro del módulo de Planificación permite definir qué magnitudes
(medidas) y registros deben registrarse para cada disparo de la prueba. A través de esta pestaña, se
podrán seleccionar de forma rápida y estructurada las medidas requeridas para cada disparo.
```
### 7.1 Estructura y comportamiento de la sección Medidas y registros

```
Al acceder a la sección Medidas y registros , el sistema mostrará las series creadas para la prueba en
forma de listas desplegables (Serie 1, Serie 2, etc.).
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
El usuario podrá:
```

```
Página: 29 de 37 Edición: 0 X
```
- **Asignar magnitudes y registros** a nivel de serie. Estas se aplicarán automáticamente a todos los
    disparos que la componen.
- **Aplicar la configuración de forma masiva** mediante el botón **“Extender configuración”**. Al pulsar
    este botón, se abrirá una pantalla donde el usuario podrá:
        Seleccionar las **series** a las que desea aplicar la configuración.
        Definir los parámetros que se aplicarán.
        Confirmar la acción mediante el botón **Aplicar** o cancelar la operación.

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
```
Comportamiento esperado
```
- Si el usuario utiliza el botón **“Extender configuración”** :
     Puede aplicarlas a toda la prueba.
     Puede aplicarlas únicamente a una o varias series concretas.
- Cuando se extienden **Medidas y registros** , estas **sobrescriben** las medidas y registros previamente
    asignados en las series/disparos seleccionados.
La opción **“Extender configuración”** deberá implementarse como un elemento de interfaz claramente
visible (por ejemplo, una casilla de verificación).

### 7.2 Selección de medidas y registros

```
Dentro de la pestaña correspondiente a cada serie en la sección Medidas y registros , se muestra una
estructura organizada por categorías , cada una con su propio selector desplegable para añadir magnitudes
y/o registros. Las categorías disponibles son:
```
- **Magnitudes y registros de topografía**
- **Magnitudes y registros de municiones**


```
Página: 30 de 37 Edición: 0 X
```
- **Magnitudes y registros de armamento**
- **Magnitudes y registros de balística**

```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Las **magnitudes disponibles** para su selección se obtienen del **Catálogo de Servicios** , que constituye la
referencia oficial de los servicios acreditados por ENAC que ofrece el centro. Dicho catálogo recoge, para
cada servicio, el método de ensayo correspondiente, las magnitudes a determinar, el rango de medida
aplicable y la incertidumbre o capacidad metrológica asociada. Su mantenimiento y actualización
corresponde al **departamento de Calidad** , tal como se detalla en el apartado **Gestión del Catálogo de
Servicios** del documento Administración del sistema.


```
Página: 31 de 37 Edición: 0 X
```
```
La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo.
```
Cada selector permite buscar y añadir elementos mediante un cuadro de búsqueda predictivo que consulta
las magnitudes y registros disponibles en el maestro **Catálogo de Magnitudes y Registros.**

En los desplegables, aparecerán las magnitudes y registros de la unidad correspondiente y junto a ellas, el
procedimiento asociado si existe. El usuario tendrá la posibilidad de marcar las magnitudes o registros
como favoritos, de esa forma aparecerán al principio de la lista.

Para pruebas en las que se establecen criterios de aceptación o rechazo para valores magnitudes
cuantitativas, el usuario deberá informar los valores correspondientes a:

- **Límite superior**
- **Límite inferior**
- **Desviación máxima permitida**

Si el usuario desea eliminar una medida o registro seleccionado, podrá hacerlo directamente desde la lista
de medidas/registros seleccionados.

En la pantalla estarán disponibles los siguientes botones:

- **Cancelar** : Permite descartar los cambios realizados y volver al estado anterior sin guardar la
    información introducida.


```
Página: 32 de 37 Edición: 0 X
```
- **Guardar borrador** : Guarda la información introducida hasta el momento sin necesidad de completar
    el registro. El contenido quedará almacenado como borrador y podrá ser editado posteriormente.

## 8 VALIDACIÓN DE LA PLANIFICACIÓN

### 8.1 Proceso de validación

```
Este apartado describe el proceso de validación de la planificación. La validación garantiza que la
planificación completa ha sido revisada y aprobada por los responsables correspondientes antes de que
los distintos departamentos puedan acceder a ella. Este proceso genera automáticamente la Nota de
experiencias y habilita la pestaña de Planificación para el resto de departamentos, permitiéndoles
visualizarla y comenzar a preparar la prueba.
```
1. **Inicio de la validación**
    - El usuario accede a la **subpestaña General** del apartado de Planificación.
    - Solo pueden iniciar la validación los usuarios con rol **Jefe de Planificación y Análisis** y el
       **Administrador del sistema**.


```
Página: 33 de 37 Edición: 0 X
```
_La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo._

2. **Clic en el botón Validar**
    - Una vez completada la planificación, el usuario con rol de Jefe del Área de Planificación y
       Análisis o Administrador del sistema podrán seleccionar la opción **Validar.**
    - El sistema comprobará si los campos Zona o Módulo del componente de munición Carga de
       proyección han sido informados. En caso contrario, se mostrará un mensaje indicando que se
       utilizará factor 1 para el cálculo de los disparos EMT.
    - El sistema genera una **Nota de experiencias** , basada en una la plantilla adjunta a este
       documento. El origen de los datos incluidos en esta nota de experiencias se describe en el Anexo
       I. La Nota de experiencias se añade a la **tabla de documentos** de la ficha de información general
       de la prueba.
    - La prueba cambia automáticamente a **estado Planificada**.


```
Página: 34 de 37 Edición: 0 X
```
_La pantalla presentada es referencial y puede sufrir modificaciones durante la fase de desarrollo._

3. **Restricciones tras la validación**
    - La planificación queda **bloqueada** y no puede ser modificada. En caso de ser necesario realizar
       alguna modificación posterior a la validación, los usuarios autorizados dispondrán del botón
       **Modificar planificación** , que les permitirá editar la planificación como se indica en el siguiente
       punto.
4. **Edición posterior**
    - Mediante el botón **Modificar planificación** , los usuarios con rol de Jefe del Área de Planificación
       y Análisis o Administrador del sistema podrán editar la planificación nuevamente.
    - Tras cualquier modificación, será necesario **validar de nuevo** , generándose una **nueva versión**
       **de la Nota de experiencias**.
    - Durante este proceso, el flujo de validación se repite desde el paso 1.


```
Página: 35 de 37 Edición: 0 X
```
### 8.2 Generación del catálogo de ensayos.................................................................................................................

```
Una vez completada la planificación de las medidas y validada la planificación completa por el usuario
responsable, el sistema generará automáticamente un Catálogo de Ensayos para la prueba. Este
documento tendrá validez contractual y deberá ser firmado por el cliente antes de la ejecución de la
prueba.
Para cada medida acreditada por ENAC (magnitud) seleccionada en la tabla de planificación, se incluirá en
el catálogo la siguiente información, obtenida del Catálogo de Servicios :
```
- **Método de ensayo (procedimiento):** Procedimiento asociado a la medida, que detalla cómo debe
    realizarse la toma de datos (puede incluir referencias normativas, protocolos internos u otros
    documentos técnicos).
- **Magnitud:** Nombre de la medida o parámetro seleccionada (por ejemplo, velocidad, presión, etc.).
- **Rango de medida:** Intervalo válido para la medición de la magnitud en cuestión, según el tipo de
    prueba y el instrumental disponible.
- **Incertidumbre / Capacidad de medida metrológica:** Valor que representa la precisión esperada
    de la medición, expresado según normativa metrológica vigente (por ejemplo, ±0,5% del valor
    medido).

## 9 RESPONSABILIDAD

```
(A rellenar por el INTA)
```
## 10 DIAGRAMA DE FLUJO

```
No aplicable.
```
## 11 PLANTILLAS

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
## 12 ANEXO I

**Origen de los datos incluidos en la nota de experiencias según la plantilla FT-0402(NOTA EXPERIENCIAS)**

**1. Objeto.** _El sistema deberá mostrar la información correspondiente al campo “Objeto de la prueba”_
    registrada en la pestaña Planificación General.
**2. Organismo solicitante.** El sistema deberá mostrar la información del organismo solicitante asociada al
    _campo “Cliente” en la pestaña Planificación General, incluyendo el nombre, el domicilio y el teléfono de_
    contacto del solicitante. Estos datos estarán previamente registrados en Calibry y se recuperarán
    automáticamente para su visualización. En caso de que alguno de los datos no esté disponible en
    Calibry, el campo correspondiente se mostrará vacío.


```
Página: 36 de 37 Edición: 0 X
```
**3. Referencias.** El sistema deberá mostrar un listado de todos los documentos asociados a la prueba en
    el momento de la generación de la nota de experiencias, indicando para cada documento el tipo, el
    título y la fecha de subida. En caso de existir varias versiones de un mismo documento, se mostrará
    únicamente la versión en vigor.
**4. Procedimientos y/o instrucciones técnicas.** El sistema deberá mostrar un listado de procedimientos
    y/o instrucciones técnicas acreditados por ENAC, que serán los mismos que se incluyen en el Catálogo
    de ensayo (apartado 8.2 del presente documento).
**5. Fecha prevista de realización.** El sistema deberá mostrar la fecha prevista de realización de la prueba,
    _recuperando la información registrada en el campo “Fecha programada” de la pestaña Información_
    general de la prueba, así como la línea donde se ejecutará la prueba en cada una de las fechas
    seleccionadas.
**6. Espécimen objeto de la prueba.** El sistema deberá mostrar la información correspondiente al
    _espécimen objeto de la prueba, recuperando los datos registrados en el campo “Espécimen” de la_
    pestaña Planificación General, incluyendo la denominación y el lote del espécimen.
**7. Componentes de la prueba**
    **a. Arma empleada.** El sistema deberá mostrar la información relativa al arma empleada en forma
       de tabla, recuperando los datos registrados en los campos denominación arma, denominación
       tubo y vida útil, ubicados en el apartado Armamento de la pestaña Planificación. Si solo se
       utiliza un arma/tubo, se mostrará una única fila con _“_ Toda la prueba _”_. Si se utilizan varias
       armas/tubos según la serie, se mostrará una fila por cada serie o rango de disparos.

```
Denominación Arma Denominación
tubo
```
```
Instrumentado % vida
útil
```
```
Observaciones Uso
```
```
Cañón C.C. M60 105/M68 SI 25% Utilizar el tubo con nº
serie 40116
```
```
Serie 1
```
```
Obús 105/30 mm LIGHT
GUN
```
```
NO Serie 2
```
```
b. Equipos de medida. El sistema deberá incluir el siguiente texto predefinido en el apartado
Equipos de medida: “Equipos en adecuado estado de calibración para el rango de uso, e
incluidos en las familias metrológicas que se indican en los procedimientos de ensayos de
aplicaci ón a esta prueba de fuego.”
c. Munición. El sistema mostrará la munición y/o componentes de munición utilizados en la
prueba mediante una tabla repetible. La tabla mostrará la identificación del material: tipo de
elemento, denominación, lote, configuración especial del componente y uso. Si el componente
es una espoleta, en configuración se mostrará el modo de funcionamiento y, si aplica, la
graduación. Si el componente es una carga de proyección, en configuración se mostrará la
zona de carga o el número de módulos. Las columnas o bloques sin datos no se mostrarán.
```
```
Tipo Denominación Zona/Módulos Fto espoleta/Grad Lote Uso
Proyectil M107 inerte 02 - FAG- 06 Serie 1
Espoleta Falsa espoleta Falsa espoleta 01 - 25 - 1003M Serie 1
Carga de proyección M4A2 7 FAG25G001- 071 Serie 1
Proyectil HE L51A1-R AG25L001- 013 Serie 2
Espoleta KZ- 984 SQ 01 - 25 - 1003M Serie 2
Carga de proyección M4A2 7 FAG25G001- 071 Serie 2
```

```
Página: 37 de 37 Edición: 0 X
```
**8. Desarrollo de la prueba**
    **a. Temperatura de acondicionamiento.** Se mostrará en forma de tabla la información de
       acondicionamiento registrada en la sección Municiones, dentro de la pestaña Planificación. La
       tabla se visualizará de la siguiente manera:

```
b. Ensayos de laboratorio. El sistema deberá incluir en este apartado el siguiente texto
predefinido: “No aplica.”
c. Pruebas de fuego. El sistema deberá mostrar en el apartado Pruebas de fuego la información
contenida en la tabla registrada en el apartado Condiciones del disparo de la pestaña
Planificación; si toda la prueba se realiza bajo las mismas condiciones, se mostrará una única
tabla, mientras que, si las condiciones varían por serie, se generará una tabla distinta para
cada configuración en función de la serie.
```
**9. Medidas, observaciones y registros.** El sistema deberá mostrar en el apartado Medidas,
    observaciones y registros el listado de medidas y registros por departamento introducidos en la pestaña
    Medidas y registros dentro de Planificación, incluyendo únicamente aquellas que sean comunes a todas
    las series. Las medidas o registros que no sean comunes se indicarán como anotación, por ejemplo:
    _“NOTA: Serie 3: velocidad del viento (balística)”._
**10. Requisitos para aprobación o rechazo de los resultados.** El sistema deberá mostrar la información
    _registrada en el campo “Requisitos para aprobación o rechazo de los resultados” de la pestaña_
    Planificación General, junto con los límites establecidos para las magnitudes en el apartado Magnitudes
    y registros dentro de la pestaña Planificación.
**11. Criterios de calificación.** El sistema mostrará la tabla de criterios de calificación de la pestaña General
    de Planificación.
**12. Criterios meteorológicos.** El sistema mostrará los criterios elegidos en el selector Criterios STANAG
    de la pestaña General de Planificación.
**13. Información adicional del cliente.** El sistema deberá mostrar la información registrada en el campo
    _“_ Información adicional del cliente _” de la pestaña Planificación General_.

```
Tipo Tª Acond T en cámara Uso
Proyectil +21±3 ºC 24:16:03 Serie 1
Carga de proyección +21±3 ºC 24:16:03 Serie 1
Proyectil +21±3 ºC 24:16:03 Serie 2
Carga de proyección +52±0,4 ºC 24:16:03 Serie 2
```

