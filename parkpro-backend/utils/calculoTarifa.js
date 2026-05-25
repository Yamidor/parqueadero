function calcularValorParqueo(diffMs, valorHora, modoCobro) {
  const diffHoras = diffMs / (1000 * 60 * 60);
  const valor = parseFloat(valorHora) || 0;

  if (modoCobro === 'fraccion') {
    return {
      horasACobrar: parseFloat(diffHoras.toFixed(2)),
      valorTotal: Math.round(diffHoras * valor),
    };
  }

  const horasRedondeadas = Math.max(1, Math.ceil(diffHoras));
  return {
    horasACobrar: horasRedondeadas,
    valorTotal: horasRedondeadas * valor,
  };
}

module.exports = { calcularValorParqueo };
