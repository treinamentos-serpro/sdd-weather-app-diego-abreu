import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ErrorState from '../../src/components/states/ErrorState';
import { mockWeatherData } from '../../src/mocks/weather';

afterEach(cleanup);

describe('ErrorState', () => {
  it('apresenta a mensagem amigável fornecida pelo hook', () => {
    render(<ErrorState message="A requisição demorou demais." onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('A requisição demorou demais.');
  });
  it('apresenta mensagem genérica segura em alerta sem executar retry automaticamente', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir a solicitação.');
    expect(screen.getByRole('alert')).not.toHaveTextContent(/https?:|payload|stack/i);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('identifica falha de busca sem apresentar cidade meteorológica', () => {
    render(<ErrorState operation="search" city={mockWeatherData.city} onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível buscar cidades.');
    expect(screen.queryByText(/São Paulo/)).not.toBeInTheDocument();
  });

  it('identifica a cidade solicitada sem renderizar medidas meteorológicas', () => {
    render(<ErrorState operation="weather" city={mockWeatherData.city} onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível consultar o clima.');
    expect(screen.getByRole('alert')).toHaveTextContent('São Paulo, São Paulo, Brasil');
    expect(screen.queryByText(/°C|km\/h|hPa/)).not.toBeInTheDocument();
  });

  it.each([
    'click',
    'enter',
    'space',
  ])('executa retry exatamente uma vez por %s', async (method) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <ErrorState onRetry={onRetry} />
      </form>,
    );
    const button = screen.getByRole('button', { name: 'Tentar novamente' });
    if (method === 'click') {
      await user.click(button);
    } else {
      await user.tab();
      expect(button).toHaveFocus();
      await user.keyboard(method === 'enter' ? '{Enter}' : ' ');
    }
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
