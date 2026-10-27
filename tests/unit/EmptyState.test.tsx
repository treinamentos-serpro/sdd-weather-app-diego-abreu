import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';

afterEach(cleanup);

describe('EmptyState', () => {
  it('anuncia título e dica de busca vazia sem alerta de erro ou retry', () => {
    render(<EmptyState />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(
      within(status).getByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).toBeVisible();
    expect(status).toHaveTextContent(
      'Confira o nome da cidade ou tente uma busca mais específica.',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('permite título e dica próprios para a apresentação inicial', () => {
    render(<EmptyState title="Busque uma cidade" hint="Digite o nome e selecione Buscar." />);
    expect(screen.getByRole('heading', { name: 'Busque uma cidade' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Digite o nome e selecione Buscar.');
  });
});
