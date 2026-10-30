import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { AMASON_PRODUCTS, usdToKrw } from '@/content/amason';
import { useGameStore } from '@/store/gameStore';
import { useAmasonStore } from '@/store/amasonStore';
import { AmasonApp } from './AmasonApp';
import { ProductThumb } from './ProductThumb';

const CABLE = AMASON_PRODUCTS.find((product) => product.id === 'cable-usbc-2m')!;
const KETTLE = AMASON_PRODUCTS.find((product) => product.id === 'kettle-pourover')!;

beforeEach(() => {
  useAmasonStore.getState().reset();
  useGameStore.setState({ cash: 1_500_000, gameDateTime: '2026-03-15T09:00:00.000Z' });
});

describe('Amason', () => {
  it('opens as an English storefront with deals and a search box', () => {
    render(<AmasonApp />);

    expect(screen.getByRole('searchbox', { name: 'Search Amason' })).toBeInTheDocument();
    expect(screen.getByText("Today's Deals")).toBeInTheDocument();
    expect(screen.getByText('Top picks for you')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Your Orders' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: KETTLE.title })).toBeInTheDocument();
  });

  it('narrows the grid down as you search', async () => {
    render(<AmasonApp />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search Amason' }), 'coffee');

    expect(await screen.findByText(/Coffee Maker/)).toBeInTheDocument();
    expect(screen.queryByText(CABLE.title)).not.toBeInTheDocument();
  });

  it('says so when a search finds nothing', async () => {
    render(<AmasonApp />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search Amason' }), 'zzzz');

    expect(await screen.findByText('No results for that search')).toBeInTheDocument();
  });

  it('filters by department', async () => {
    render(<AmasonApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Beauty' }));

    expect(await screen.findByText(/Vitamin C Brightening Serum/)).toBeInTheDocument();
    expect(screen.queryByText(CABLE.title)).not.toBeInTheDocument();
  });

  it('opens a listing, adds to the cart, and shows the badge', async () => {
    render(<AmasonApp />);
    await userEvent.click(screen.getByRole('button', { name: KETTLE.title }));

    const listing = await screen.findByRole('dialog', { name: KETTLE.title });
    expect(within(listing).getByText('Add to Cart')).toBeInTheDocument();
    expect(within(listing).getByText('Buy Now')).toBeInTheDocument();
    expect(within(listing).getByText(/FREE delivery/)).toBeInTheDocument();

    await userEvent.click(within(listing).getByText('Add to Cart'));

    expect(useAmasonStore.getState().cart[KETTLE.id]).toBe(1);
    expect(await screen.findByRole('status')).toHaveTextContent('Added to Cart');
  });

  it('checks out: spends cash, empties the cart and files the order', async () => {
    render(<AmasonApp />);
    const before = useGameStore.getState().cash;

    await userEvent.click(screen.getByRole('button', { name: KETTLE.title }));
    await userEvent.click(await screen.findByText('Add to Cart'));
    await userEvent.click(screen.getByRole('button', { name: 'Open cart, 1 items' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Place your order' }));

    const totalKrw = usdToKrw(KETTLE.price);
    expect(useGameStore.getState().cash).toBe(before - totalKrw);
    expect(useAmasonStore.getState().cart).toEqual({});

    const orders = useAmasonStore.getState().orders;
    expect(orders).toHaveLength(1);
    expect(orders[0].totalKrw).toBe(totalKrw);
    expect(orders[0].id).toMatch(/^AM-[0-9A-Z]{6}$/);

    // The app drops you on "Your Orders" with the new order on screen.
    expect(await screen.findByRole('heading', { name: 'Your Orders' })).toBeInTheDocument();
    expect(screen.getByText(`Order ${orders[0].id}`)).toBeInTheDocument();
    expect(screen.getByText(/Arriving/)).toBeInTheDocument();
  });

  it('refuses to order when the cash is short', async () => {
    useGameStore.setState({ cash: 1_000 });
    render(<AmasonApp />);

    await userEvent.click(screen.getByRole('button', { name: KETTLE.title }));
    await userEvent.click(await screen.findByText('Add to Cart'));
    await userEvent.click(screen.getByRole('button', { name: 'Open cart, 1 items' }));

    const cta = await screen.findByRole('button', { name: 'Place your order' });
    expect(cta).toBeDisabled();
    expect(
      screen.getByText(new RegExp(`Not enough cash — you need .+ more`)),
    ).toBeInTheDocument();
    expect(useAmasonStore.getState().orders).toEqual([]);
  });

  it('asks for something to buy when the cart is empty', async () => {
    render(<AmasonApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Cart' }));

    expect(await screen.findByText('Your Amason cart is empty')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep shopping' }));
    await waitFor(() => expect(screen.getByText("Today's Deals")).toBeInTheDocument());
  });
});

describe('Amason product art', () => {
  it('uses the image URL when a listing has one', () => {
    render(<ProductThumb product={{ ...CABLE, image: 'https://example.com/cable.png' }} />);
    expect(screen.getByRole('img', { name: CABLE.title })).toHaveAttribute(
      'src',
      'https://example.com/cable.png',
    );
  });

  it('draws a category tile instead of a broken image', () => {
    render(<ProductThumb product={CABLE} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
