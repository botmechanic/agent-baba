<p align="center">
  <img src="agent-baba-github.jpg" alt="Agent Baba Logo" width="480"/>
</p>

## Agent BABA: Autonomous Solana Trading Agent with RAG-Enhanced Decision Making

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Bun](https://img.shields.io/badge/Built%20with-Bun-orange)](https://bun.sh/)
[![Powered by Solana](https://img.shields.io/badge/Powered%20by-Solana-purple)](https://solana.com/)

### 🌟 Overview

Agent BABA is an innovative autonomous trading agent that operates on the Solana blockchain, specifically designed to optimize trading strategies for the $BABABILL token through Meteora liquidity pools. By combining the power of Retrieval Augmented Generation (RAG), pgAI vector embeddings, and autonomous decision-making capabilities, Agent BABA represents a new paradigent in on-chain trading automation.

### 🏗️ Architecture

```mermaid
flowchart TB
    subgraph On-Chain
        MP[Meteora Pool] <--> SA[Solana Agent Kit]
        SA <--> JE[Jupiter Exchange]
    end

    subgraph Agent BABA Core
        AB[Agent BABA] --> SA
        AB --> DB[(PGAI Vector DB)]
        AB --> CA[Claude AI]
        DB --> RAG[RAG Engine]
        RAG --> CA
    end

    subgraph Analysis Flow
        DB --> VA[Vector Analysis]
        VA --> TS[Trade Signals]
        TS --> AB
    end

    subgraph Learning Loop
        MP --> |Pool State| DB
        SA --> |Trade Results| DB
        CA --> |Trading Insights| DB
        DB --> |Historical Context| AB
    end

    style Agent BABA Core fill:#f9f,stroke:#333,stroke-width:2px
    style On-Chain fill:#bbf,stroke:#333,stroke-width:2px
    style Analysis Flow fill:#bfb,stroke:#333,stroke-width:2px
    style Learning Loop fill:#fbb,stroke:#333,stroke-width:2px
```

### 🚀 Key Features

#### 1. Autonomous Trading

- Real-time monitoring of Meteora pools
- Automated micro-trading strategies
- Self-adjusting parameters based on market conditions
- Slippage protection and fail-safes

#### 2. RAG-Enhanced Decision Making

- Vector embeddings of historical trades
- Semantic search for similar market conditions
- AI-powered strategy optimization
- Continuous learning from trade outcomes

#### 3. Advanced Analytics

- Real-time price impact analysis
- Liquidity depth monitoring
- Performance tracking and optimization
- Historical trade pattern analysis

### 🛠️ Technical Stack

- **Blockchain**: Solana
- **DEX Integration**: Meteora/Jupiter
- **Language**: TypeScript/Bun
- **AI**: Claude AI (Anthropic)
- **Vector Database**: PGAI
- **Server**: Hono
- **SDK**: Solana Agent Kit

### 📊 Data Flow

1. **Market Monitoring**

   - Continuous monitoring of Meteora pool states
   - Real-time price and liquidity tracking
   - Transaction monitoring and analysis

2. **Trade Analysis**

   - Vector embedding of trade parameters
   - Semantic similarity search for historical context
   - AI-powered outcome prediction
   - Risk assessment and optimization

3. **Execution**
   - Smart order routing via Jupiter
   - Slippage protection
   - Transaction verification
   - Performance recording

### 💡 Innovation Highlights

- **First RAG-Enhanced Solana Trading Agent**: Combines on-chain data with AI-powered decision making
- **Autonomous Learning Loop**: Continuously improves trading strategies based on outcomes
- **Vector-Based Market Analysis**: Uses cutting-edge vector similarity for market pattern recognition
- **Micro-Trading Optimization**: Specialized in small, efficient trades for optimal returns

### 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agent-baba.git

# Install dependencies
bun install

# Initialize the database
bun run init-db

# Start the agent
bun run dev
```

### 🌐 API Endpoints

- `GET /health` - Check agent status
- `GET /price` - Get current BABABILL price
- `GET /estimate-trade` - Estimate trade outcome

### 🔒 Environment Variables

```env
HELIUS_RPC_URL=your_helius_url
CLAUDE_API_KEY=your_claude_key
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=agent_baba
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

### 👥 Team

Built with 💜 by Team BABABILL for the Solana AI Agent Hackathon

### 📄 License

MIT License - see LICENSE for details
