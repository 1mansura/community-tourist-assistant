import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NotificationProvider, useNotification } from './NotificationContext';

function Trigger({
  duration = 1000,
  variant = 'success',
}: {
  duration?: number;
  variant?: 'success' | 'info' | 'error' | 'reward';
}) {
  const { showNotification } = useNotification();

  return (
    <button
      type="button"
      onClick={() => showNotification('Notification message', variant, duration, 'Notification subtitle')}
    >
      Show notification
    </button>
  );
}

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders a notification when triggered', () => {
    render(
      <NotificationProvider>
        <Trigger />
      </NotificationProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show notification' }));

    expect(screen.getByText('Notification message')).toBeInTheDocument();
    expect(screen.getByText('Notification subtitle')).toBeInTheDocument();
  });

  it('auto-dismisses after its duration', () => {
    render(
      <NotificationProvider>
        <Trigger duration={800} />
      </NotificationProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show notification' }));
    expect(screen.getByText('Notification message')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(screen.queryByText('Notification message')).not.toBeInTheDocument();
  });

  it('pauses dismissal while hovered', () => {
    render(
      <NotificationProvider>
        <Trigger duration={1000} />
      </NotificationProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show notification' }));
    const notification = screen.getByText('Notification message').closest('[role="status"]');
    expect(notification).not.toBeNull();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    fireEvent.mouseEnter(notification!);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Notification message')).toBeInTheDocument();

    fireEvent.mouseLeave(notification!);

    act(() => {
      jest.advanceTimersByTime(800);
    });

    expect(screen.queryByText('Notification message')).not.toBeInTheDocument();
  });
});
