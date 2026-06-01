export interface UIDialogConfirm {
  title: string;
  /**
   * subtítulo del mensaje. Acepta variables dinámicas seteadas en el campo title2Param
   * Si usa parámetros el mensaje de este campo, la variable a usar será paramTitle2
   * example: "Vas a eliminar la prueba: {{ paramTitle2 }}"
   *
   */
  title2?: string;
  /**
   * opcional
   * Parametro para inyectar en el title2.
   *
   */
  title2Param?: string;
  description?: string;
  htmlText?: string;
  labelButtonConfirm: string;
}

export interface UIDialogInput {
  title: string;
  placeholder: string;
  labelButtonConfirm: string;
  labelCancel?: string;
  fieldText?: string;
}
