/**
 * Paginación reutilizable.
 *
 * Uso típico:
 *   const { pagina, setPagina, porPagina, setPorPagina, datosPagina, Controles } =
 *     usePaginacion(datosCompletos, 10);
 *
 *   {datosPagina.map(...)}
 *   <Controles />
 */
import { useState, useMemo, useEffect } from 'react';

export function usePaginacion(datos, porPaginaInicial = 10) {
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(porPaginaInicial);
  const total = datos?.length || 0;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  // Si cambian los datos o el tamaño y la página actual queda fuera, vuelve a 1
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1);
  }, [total, porPagina, totalPaginas, pagina]);

  const datosPagina = useMemo(() => {
    const desde = (pagina - 1) * porPagina;
    return (datos || []).slice(desde, desde + porPagina);
  }, [datos, pagina, porPagina]);

  const Controles = () => (
    <PaginacionUI
      pagina={pagina}
      totalPaginas={totalPaginas}
      total={total}
      porPagina={porPagina}
      setPagina={setPagina}
      setPorPagina={setPorPagina}
    />
  );

  return { pagina, setPagina, porPagina, setPorPagina, datosPagina, totalPaginas, Controles };
}

function PaginacionUI({ pagina, totalPaginas, total, porPagina, setPagina, setPorPagina }) {
  if (total === 0) return null;
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      borderTop: '1px solid var(--border)', flexWrap: 'wrap', background: 'var(--bg-elevated)',
    }}>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        Mostrando <b style={{ color: 'var(--text-primary)' }}>{desde}-{hasta}</b> de <b style={{ color: 'var(--text-primary)' }}>{total}</b>
      </div>
      <div style={{ flex: 1 }} />
      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Filas por página:
        <select
          value={porPagina}
          onChange={(e) => { setPorPagina(parseInt(e.target.value, 10)); setPagina(1); }}
          style={{
            marginLeft: 8, padding: '4px 8px', background: 'var(--bg-base)',
            color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6,
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={30}>30</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </label>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.85rem' }}
          onClick={() => setPagina(1)} disabled={pagina === 1}
        >«</button>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.85rem' }}
          onClick={() => setPagina(pagina - 1)} disabled={pagina === 1}
        >‹</button>
        <span style={{ padding: '4px 10px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {pagina} / {totalPaginas}
        </span>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.85rem' }}
          onClick={() => setPagina(pagina + 1)} disabled={pagina === totalPaginas}
        >›</button>
        <button
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: '0.85rem' }}
          onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas}
        >»</button>
      </div>
    </div>
  );
}
