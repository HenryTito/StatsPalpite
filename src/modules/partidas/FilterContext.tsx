import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Filtro da lista de partidas (RF16), compartilhado entre a Home e a tela
 * de filtros.
 *
 * Vive num contexto, e não nos parâmetros de navegação, porque a Home está
 * dentro do navegador de abas e a tela de filtros é um modal da pilha: devolver
 * o resultado por parâmetro atravessaria dois navegadores. Com o contexto, a
 * Home simplesmente reage à mudança.
 */
export type MatchFilter = {
  /** Data no formato AAAA-MM-DD. Vazio significa hoje. */
  date: string | null;
  leagueId: string | null;
  leagueName: string | null;
  teamId: string | null;
  teamName: string | null;
  status: 'scheduled' | 'live' | 'finished' | null;
};

export const EMPTY_FILTER: MatchFilter = {
  date: null,
  leagueId: null,
  leagueName: null,
  teamId: null,
  teamName: null,
  status: null,
};

/** Quantos critérios estão ativos, para o indicador no botão de filtros. */
export function countActive(filter: MatchFilter): number {
  return [filter.date, filter.leagueId, filter.teamId, filter.status].filter(Boolean).length;
}

type FilterContextValue = {
  filter: MatchFilter;
  applyFilter: (filter: MatchFilter) => void;
  clearFilter: () => void;
  activeCount: number;
};

const FilterContext = createContext<FilterContextValue | null>(null);

export function MatchFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<MatchFilter>(EMPTY_FILTER);

  const applyFilter = useCallback((next: MatchFilter) => setFilter(next), []);
  const clearFilter = useCallback(() => setFilter(EMPTY_FILTER), []);

  const value = useMemo(
    () => ({ filter, applyFilter, clearFilter, activeCount: countActive(filter) }),
    [filter, applyFilter, clearFilter],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useMatchFilter(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useMatchFilter precisa estar dentro de MatchFilterProvider');
  return context;
}
