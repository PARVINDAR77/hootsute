/**
 * Enables JSON.stringify to safely serialize BigInt values to safe integers or strings.
 */
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    const intVal = Number(this);
    return Number.isSafeInteger(intVal) ? intVal : this.toString();
  };
}
