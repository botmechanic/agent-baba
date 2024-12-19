-- Trade status enum
CREATE TYPE trade_status AS ENUM ('pending', 'executed', 'failed', 'analyzed');

-- Meteora pool states
CREATE TABLE meteora_pool_states (
    id BIGSERIAL PRIMARY KEY,
    pool_address TEXT NOT NULL,
    lp_supply TEXT NOT NULL,
    token_a_balance TEXT NOT NULL,
    token_b_balance TEXT NOT NULL,
    token_a_price NUMERIC(20,9),
    token_b_price NUMERIC(20,9),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

-- Trade records
CREATE TABLE trades (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pool_address TEXT NOT NULL,
    input_token TEXT NOT NULL,
    output_token TEXT NOT NULL,
    input_amount NUMERIC(20,9) NOT NULL,
    expected_output_amount NUMERIC(20,9) NOT NULL,
    actual_output_amount NUMERIC(20,9),
    price_impact NUMERIC(8,4),
    slippage NUMERIC(8,4),
    status trade_status NOT NULL DEFAULT 'pending',
    transaction_signature TEXT UNIQUE,
    error_message TEXT,
    pool_state_id BIGINT REFERENCES meteora_pool_states(id),
    metadata JSONB
);

-- Trade analysis (simplified without vector embeddings)
CREATE TABLE trade_analyses (
    id BIGSERIAL PRIMARY KEY,
    trade_id BIGINT REFERENCES trades(id),
    analysis_text TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    CONSTRAINT unique_trade_analysis UNIQUE (trade_id)
);

-- Function to record pool state
CREATE OR REPLACE FUNCTION record_pool_state(
    _pool_address TEXT,
    _lp_supply TEXT,
    _token_a_balance TEXT,
    _token_b_balance TEXT,
    _token_a_price NUMERIC,
    _token_b_price NUMERIC,
    _metadata JSONB DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    _state_id BIGINT;
BEGIN
    INSERT INTO meteora_pool_states (
        pool_address,
        lp_supply,
        token_a_balance,
        token_b_balance,
        token_a_price,
        token_b_price,
        metadata
    ) VALUES (
        _pool_address,
        _lp_supply,
        _token_a_balance,
        _token_b_balance,
        _token_a_price,
        _token_b_price,
        _metadata
    ) RETURNING id INTO _state_id;
    
    RETURN _state_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record a new trade
CREATE OR REPLACE FUNCTION record_trade(
    _pool_address TEXT,
    _input_token TEXT,
    _output_token TEXT,
    _input_amount NUMERIC,
    _expected_output NUMERIC,
    _pool_state_id BIGINT,
    _metadata JSONB DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    _trade_id BIGINT;
BEGIN
    INSERT INTO trades (
        pool_address,
        input_token,
        output_token,
        input_amount,
        expected_output_amount,
        pool_state_id,
        metadata
    ) VALUES (
        _pool_address,
        _input_token,
        _output_token,
        _input_amount,
        _expected_output,
        _pool_state_id,
        _metadata
    ) RETURNING id INTO _trade_id;
    
    RETURN _trade_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for efficient querying
CREATE INDEX ON meteora_pool_states (pool_address, timestamp DESC);
CREATE INDEX ON trades (pool_address, timestamp DESC);