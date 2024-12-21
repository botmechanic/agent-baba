// src/db/schema.ts

export const SCHEMA = `
  -- First drop any existing objects
  DROP TABLE IF EXISTS trade_embeddings_store CASCADE;
  DROP TABLE IF EXISTS portfolio_snapshots CASCADE;
  DROP TABLE IF EXISTS paper_trades CASCADE;
  DROP TABLE IF EXISTS paper_portfolios CASCADE;
  DROP TABLE IF EXISTS meteora_pool_states CASCADE;
  DROP VIEW IF EXISTS trade_embeddings CASCADE;
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

  -- Create trade embeddings storage
  CREATE TABLE trade_embeddings_store (
      id SERIAL PRIMARY KEY,
      chunk_id TEXT NOT NULL,
      trade_id INTEGER REFERENCES paper_trades(id),
      metadata JSONB,
      embedding VECTOR(1536),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  -- Create embeddings view combining trade data with embeddings
  CREATE VIEW trade_embeddings AS
  SELECT 
      es.id as embedding_id,
      es.chunk_id,
      es.embedding,
      t.id as trade_id,
      t.trade_type,
      t.token_in,
      t.token_out,
      t.amount_in,
      t.amount_out,
      t.price_at_trade,
      t.estimated_price_impact,
      t.slippage_bps,
      t.fees_sol,
      t.trade_pnl_usd,
      t.created_at as trade_time,
      es.metadata as embedding_metadata,
      t.metadata as trade_metadata
  FROM trade_embeddings_store es
  JOIN paper_trades t ON es.trade_id = t.id;

  -- Create indexes
  CREATE INDEX idx_paper_trades_portfolio_id ON paper_trades(portfolio_id);
  CREATE INDEX idx_portfolio_snapshots_portfolio_id ON portfolio_snapshots(portfolio_id);
  CREATE INDEX idx_paper_portfolios_wallet_address ON paper_portfolios(wallet_address);
  CREATE INDEX trade_embeddings_store_embedding_idx ON trade_embeddings_store USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
`;