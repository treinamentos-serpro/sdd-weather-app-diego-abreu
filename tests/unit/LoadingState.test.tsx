import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import LoadingState from '../../src/components/states/LoadingState';

afterEach(cleanup);

describe('LoadingState', () => {
  it.each([
    ['search', 'Buscando cidades…'],
    ['weather', 'Consultando o clima…'],
  ] as const)('anuncia a operação %s educadamente', (operation, message) => {
    render(<LoadingState operation={operation} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
    expect(status).toHaveTextContent(message);
    expect(status).not.toHaveTextContent(/https?:|payload/i);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('usa consulta meteorológica por padrão', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveTextContent('Consultando o clima…');
  });
});
