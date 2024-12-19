export const SCHEMA = `
  -- Drop existing objects
  DROP TABLE IF EXISTS portfolio_snapshots CASCADE;
  DROP TABLE IF EXISTS paper_trades CASCADE;
  DROP TABLE IF EXISTS paper_portfolios CASCADE;
  DROP TABLE IF EXISTS meteora_pool_states CASCADE;
  DROP TYPE IF EXISTS trade_status CASCADE;

  -- Create trade status enum
  CREATE TYPE trade_status AS ENUM ('PENDING', 'EXECUTED', 'FAILED', 'CANCELLED');

  -- Create meteora pool states table first
  CREATE TABLE meteora_pool_states (
      id SERIAL PRIMARY KEY,
      pool_address TEXT NOT NULL,
      lp_supply TEXT NOT NULL,
      token_a_balance TEXT NOT NULL,
      token_b_balance TEXT NOT NULL,
      token_a_price NUMERIC NOT NULL DEFAULT 0,
      token_b_price NUMERIC NOT NULL DEFAULT 0,
      metadata JSONB,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- Create paper portfolios table
  CREATE TABLE paper_portfolios (
      id SERIAL PRIMARY KEY,
      wallet_address TEXT NOT NULL,
      initial_balance_sol NUMERIC NOT NULL DEFAULT 1,
      initial_balance_bababill NUMERIC NOT NULL DEFAULT 1000,
      current_balance_sol NUMERIC NOT NULL DEFAULT 1,
      current_balance_bababill NUMERIC NOT NULL DEFAULT 1000,
      total_pnl_usd NUMERIC DEFAULT 0,
      total_fees_sol NUMERIC DEFAULT 0,
      trades_count INTEGER DEFAULT 0,
      winning_trades_count INTEGER DEFAULT 0,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- Create paper trades table
  CREATE TABLE paper_trades (
      id SERIAL PRIMARY KEY,
      portfolio_id INTEGER REFERENCES paper_portfolios(id),
      trade_type TEXT NOT NULL,
      token_in TEXT NOT NULL,
      token_out TEXT NOT NULL,
      amount_in NUMERIC NOT NULL DEFAULT 0,
      amount_out NUMERIC NOT NULL DEFAULT 0,
      price_at_trade NUMERIC NOT NULL DEFAULT 0,
      estimated_price_impact NUMERIC NOT NULL DEFAULT 0,
      slippage_bps INTEGER NOT NULL DEFAULT 0,
      fees_sol NUMERIC NOT NULL DEFAULT 0,
      virtual_signature TEXT,
      pool_state_id INTEGER REFERENCES meteora_pool_states(id),
      status trade_status NOT NULL DEFAULT 'PENDING',
      executed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      trade_pnl_usd NUMERIC DEFAULT 0,
      metadata JSONB
  );

  -- Create portfolio snapshots table
  CREATE TABLE portfolio_snapshots (
      id SERIAL PRIMARY KEY,
      portfolio_id INTEGER REFERENCES paper_portfolios(id),
      balance_sol NUMERIC NOT NULL DEFAULT 1,
      balance_bababill NUMERIC NOT NULL DEFAULT 1000,
      sol_price_usd NUMERIC NOT NULL DEFAULT 40,
      bababill_price_usd NUMERIC NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes
  CREATE INDEX idx_paper_trades_portfolio_id ON paper_trades(portfolio_id);
  CREATE INDEX idx_portfolio_snapshots_portfolio_id ON portfolio_snapshots(portfolio_id);
  CREATE INDEX idx_paper_portfolios_wallet_address ON paper_portfolios(wallet_address);
`;